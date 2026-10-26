package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.exception.ErrorResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    private final AtividadeRepository atividadeRepository;
    private final TurmaRepository turmaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final EntregaIndividualRepository entregaRepository;

    @Transactional
    public ResponseAtividadeDTO cadastrar(UUID turmaId, RequestAtividadeDTO dto, Usuario usuario) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        if (!turma.getProfessor().getId().equals(usuario.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Somente o professor da turma pode cadastrar atividades.");
        }

        LocalDateTime disponivelEm = dto.disponivelEm() != null ? dto.disponivelEm() : LocalDateTime.now();
        validarPrazo(dto.prazoFinal(), disponivelEm);

        Atividade atividade = new Atividade();
        atividade.setTurma(turma);
        atividade.setNome(dto.nome().trim());
        atividade.setDescricao(dto.descricao() != null ? dto.descricao().trim() : null);
        atividade.setTipo(dto.tipo());
        atividade.setDisponivelEm(disponivelEm);
        atividade.setPrazoFinal(dto.prazoFinal());
        atividade.setAceitaAtraso(dto.aceitaAtraso() == null || dto.aceitaAtraso());

        Atividade salva = atividadeRepository.save(atividade);
        return mapearParaDTO(salva, null, null);
    }

    @Transactional
    public ResponseAtividadeDTO atualizar(UUID atividadeId, RequestAtividadeDTO dto, Usuario usuario) {
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        if (!atividade.getTurma().getProfessor().getId().equals(usuario.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Somente o professor da turma pode editar atividades.");
        }

        LocalDateTime disponivelEm = dto.disponivelEm() != null ? dto.disponivelEm() : atividade.getDisponivelEm();
        validarPrazo(dto.prazoFinal(), disponivelEm);

        atividade.setNome(dto.nome().trim());
        atividade.setDescricao(dto.descricao() != null ? dto.descricao().trim() : null);
        atividade.setTipo(dto.tipo());
        atividade.setDisponivelEm(disponivelEm);
        atividade.setPrazoFinal(dto.prazoFinal());
        if (dto.aceitaAtraso() != null) {
            atividade.setAceitaAtraso(dto.aceitaAtraso());
        }

        return mapearParaDTO(atividadeRepository.save(atividade), null, null);
    }

    @Transactional(readOnly = true)
    public List<AlunoResumoDTO> listarSemEntrega(UUID atividadeId, Usuario professor) {
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        if (!atividade.getTurma().getProfessor().getId().equals(professor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Acesso restrito ao professor da turma.");
        }

        Set<UUID> jaEntregaram = new HashSet<>();
        entregaRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividadeId)
                .forEach(e -> jaEntregaram.add(e.getAluno().getId()));

        return inscricaoRepository.findByTurmaId(atividade.getTurma().getId()).stream()
                .map(i -> i.getAluno())
                .filter(aluno -> !jaEntregaram.contains(aluno.getId()))
                .map(aluno -> new AlunoResumoDTO(aluno.getId(), aluno.getNome(), aluno.getEmail()))
                .sorted(Comparator.comparing(AlunoResumoDTO::nome, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private void validarPrazo(LocalDateTime prazoFinal, LocalDateTime disponivelEm) {
        if (prazoFinal.isBefore(disponivelEm)) {
            throw new AppException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "O prazo final não pode ser antes de quando a atividade fica disponível.",
                    List.of(new ErrorResponseDTO.CampoErroDTO("prazoFinal", "O prazo final não pode ser antes de quando a atividade fica disponível."))
            );
        }
    }

    @Transactional(readOnly = true)
    public List<ResponseAtividadeDTO> listarPorTurma(
            UUID turmaId,
            Usuario usuario,
            String estadoFiltro,
            TipoAtividade tipoFiltro,
            String ordenar,
            String direcao
    ) {
        String estado = normalizarEstado(estadoFiltro);
        Comparator<ResponseAtividadeDTO> ordem = ordenacao(ordenar, direcao);

        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        boolean isProfessor = turma.getProfessor().getId().equals(usuario.getId());
        boolean isAluno = inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, usuario.getId());

        if (!isProfessor && !isAluno) {
            throw new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada.");
        }

        List<Atividade> atividades = atividadeRepository.findByTurmaId(turmaId);
        LocalDateTime agora = LocalDateTime.now();

        if (isProfessor) {
            // o estado e do aluno (depende da entrega dele): o professor so filtra por tipo
            return atividades.stream()
                    .filter(a -> tipoFiltro == null || a.getTipo() == tipoFiltro)
                    .map(a -> mapearParaDTO(a, null, null))
                    .sorted(ordem)
                    .toList();
        }

        return atividades.stream()
                .filter(a -> !a.getDisponivelEm().isAfter(agora))
                .filter(a -> tipoFiltro == null || a.getTipo() == tipoFiltro)
                .map(a -> {
                    Optional<EntregaIndividual> entrega = entregaRepository.findByAtividadeIdAndAlunoId(a.getId(), usuario.getId());
                    String estadoAtual = calcularEstado(a, entrega.orElse(null), agora);
                    BigDecimal nota = entrega.map(EntregaIndividual::getNota).orElse(null);
                    return mapearParaDTO(a, estadoAtual, nota);
                })
                .filter(dto -> estado == null || dto.estado().equals(estado))
                .sorted(ordem)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResponseAtividadeDTO> listarMinhasAtividades(
            Usuario usuario,
            String estadoFiltro,
            TipoAtividade tipoFiltro,
            UUID turmaIdFiltro,
            String ordenar,
            String direcao
    ) {
        String estado = normalizarEstado(estadoFiltro);
        Comparator<ResponseAtividadeDTO> ordem = ordenacao(ordenar, direcao);
        List<Atividade> disponiveis = atividadeRepository.findDisponiveisParaAluno(usuario.getId());
        LocalDateTime agora = LocalDateTime.now();

        return disponiveis.stream()
                .filter(a -> turmaIdFiltro == null || a.getTurma().getId().equals(turmaIdFiltro))
                .filter(a -> tipoFiltro == null || a.getTipo() == tipoFiltro)
                .map(a -> {
                    Optional<EntregaIndividual> entrega = entregaRepository.findByAtividadeIdAndAlunoId(a.getId(), usuario.getId());
                    String estadoAtual = calcularEstado(a, entrega.orElse(null), agora);
                    BigDecimal nota = entrega.map(EntregaIndividual::getNota).orElse(null);
                    return mapearParaDTO(a, estadoAtual, nota);
                })
                .filter(dto -> estado == null || dto.estado().equals(estado))
                .sorted(ordem)
                .toList();
    }

    private static final Set<String> ESTADOS = Set.of(
            "PENDENTE", "ENTREGUE", "ENTREGUE_COM_ATRASO", "CONCLUIDA", "ATRASADA"
    );

    private String normalizarEstado(String estadoFiltro) {
        if (estadoFiltro == null || estadoFiltro.isBlank()) {
            return null;
        }
        String estado = estadoFiltro.trim().toUpperCase();
        if (!ESTADOS.contains(estado)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Estado inválido. Use PENDENTE, ENTREGUE, ENTREGUE_COM_ATRASO, CONCLUIDA ou ATRASADA.");
        }
        return estado;
    }

    private Comparator<ResponseAtividadeDTO> ordenacao(String ordenar, String direcao) {
        if (!"prazo".equalsIgnoreCase(ordenar)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Ordenação inválida. Use ordenar=prazo.");
        }
        Comparator<ResponseAtividadeDTO> porPrazo = Comparator.comparing(ResponseAtividadeDTO::prazoFinal);
        if ("desc".equalsIgnoreCase(direcao)) {
            return porPrazo.reversed();
        }
        if (!"asc".equalsIgnoreCase(direcao)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Direção inválida. Use asc ou desc.");
        }
        return porPrazo;
    }

    @Transactional(readOnly = true)
    public ResponseAtividadeDetalheDTO obterDetalhe(UUID atividadeId, Usuario usuario) {
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        Turma turma = atividade.getTurma();
        boolean isProfessor = turma.getProfessor().getId().equals(usuario.getId());
        boolean isAluno = inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), usuario.getId());

        if (!isProfessor && !isAluno) {
            throw new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada.");
        }

        LocalDateTime agora = LocalDateTime.now();
        if (isAluno && atividade.getDisponivelEm().isAfter(agora)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Atividade ainda não disponível.");
        }

        Optional<EntregaIndividual> entregaOpt = isAluno
                ? entregaRepository.findByAtividadeIdAndAlunoId(atividadeId, usuario.getId())
                : Optional.empty();

        String estado = isAluno ? calcularEstado(atividade, entregaOpt.orElse(null), agora) : null;
        BigDecimal nota = entregaOpt.map(EntregaIndividual::getNota).orElse(null);
        ResponseEntregaIndividualDTO minhaEntrega = entregaOpt.map(this::mapearEntregaParaDTO).orElse(null);

        return new ResponseAtividadeDetalheDTO(
                atividade.getId(),
                turma.getId(),
                turma.getNome(),
                turma.getProfessor().getNome(),
                atividade.getNome(),
                atividade.getDescricao(),
                atividade.getTipo(),
                atividade.getPrazoFinal(),
                atividade.getDisponivelEm(),
                atividade.isAceitaAtraso(),
                estado,
                nota,
                minhaEntrega
        );
    }

    public String calcularEstado(Atividade atividade, EntregaIndividual entrega, LocalDateTime agora) {
        if (entrega != null) {
            if (entrega.getNota() != null) {
                return "CONCLUIDA";
            }
            if (entrega.isAtrasada()) {
                return "ENTREGUE_COM_ATRASO";
            }
            return "ENTREGUE";
        }
        if (agora.isAfter(atividade.getPrazoFinal())) {
            return "ATRASADA";
        }
        return "PENDENTE";
    }

    private ResponseAtividadeDTO mapearParaDTO(Atividade a, String estado, BigDecimal nota) {
        return new ResponseAtividadeDTO(
                a.getId(),
                a.getTurma().getId(),
                a.getTurma().getNome(),
                a.getNome(),
                a.getDescricao(),
                a.getTipo(),
                a.getPrazoFinal(),
                a.getDisponivelEm(),
                a.isAceitaAtraso(),
                estado,
                nota
        );
    }

    public ResponseEntregaIndividualDTO mapearEntregaParaDTO(EntregaIndividual e) {
        Arquivo arq = e.getArquivos().isEmpty() ? null : e.getArquivos().get(0);
        String nomeOriginal = arq != null ? arq.getNomeOriginal() : "arquivo.pdf";
        Long tamanhoBytes = arq != null ? arq.getTamanhoBytes() : 0L;
        String hashSha256 = arq != null ? arq.getHashSha256() : null;

        return new ResponseEntregaIndividualDTO(
                e.getId(),
                e.getAtividade().getId(),
                e.getAluno().getId(),
                e.getAluno().getNome(),
                nomeOriginal,
                tamanhoBytes,
                hashSha256,
                e.getEnviadaEm(),
                e.isAtrasada(),
                e.getNota(),
                e.getComentarioPrivado()
        );
    }
}

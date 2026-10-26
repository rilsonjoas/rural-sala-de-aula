package com.narniano.rural_sala_de_aula.classes.turma;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.Inscricao;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TurmaService {

    private static final String CARACTERES_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TurmaRepository turmaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AtividadeRepository atividadeRepository;
    private final EntregaIndividualRepository entregaRepository;

    @Transactional
    public ResponseTurmaDTO cadastrar(RequestTurmaDTO dto, Usuario professor) {
        Turma turma = new Turma();
        turma.setProfessor(professor);
        turma.setNome(dto.nome().trim());
        String disciplina = (dto.disciplina() != null && !dto.disciplina().isBlank())
                ? dto.disciplina().trim()
                : dto.nome().trim();
        turma.setDisciplina(disciplina);
        turma.setSemestre(dto.semestre().trim());
        turma.setDiasAula(dto.diasAula() != null ? new ArrayList<>(dto.diasAula()) : new ArrayList<>());
        turma.setDescricao(dto.descricao() != null ? dto.descricao().trim() : null);
        turma.setCodigo(gerarCodigoUnico());

        Turma salva = turmaRepository.save(turma);
        return mapearParaDTO(salva, professor);
    }

    @Transactional(readOnly = true)
    public List<ResponseTurmaDTO> listarMinhasTurmas(Usuario usuario, String semestreFiltro) {
        List<Turma> turmas = turmaRepository.findAllByUsuarioId(usuario.getId());

        return turmas.stream()
                .filter(t -> semestreFiltro == null || semestreFiltro.isBlank() || t.getSemestre().equals(semestreFiltro.trim()))
                .map(t -> mapearParaDTO(t, usuario))
                .toList();
    }

    @Transactional(readOnly = true)
    public ResponseTurmaDTO obterDetalhe(UUID turmaId, Usuario usuario) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        boolean isProfessor = turma.getProfessor().getId().equals(usuario.getId());
        boolean isAluno = inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, usuario.getId());

        if (!isProfessor && !isAluno) {
            throw new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada.");
        }

        return mapearParaDTO(turma, usuario);
    }

    @Transactional
    public ResponseTurmaDTO inscreverPorCodigo(String codigoEntrada, Usuario aluno) {
        if (codigoEntrada == null || codigoEntrada.trim().isEmpty()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Informe o código da turma.");
        }

        String codigoLimpo = codigoEntrada.replaceAll("\\s+", "").toUpperCase();
        Turma turma = turmaRepository.findByCodigoIgnoreCase(codigoLimpo)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Não encontramos uma turma com esse código. Confira com o professor."));

        if (turma.getProfessor().getId().equals(aluno.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Você é o professor desta turma.");
        }

        if (inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), aluno.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Você já está nesta turma.");
        }

        Inscricao inscricao = new Inscricao(turma, aluno);
        inscricaoRepository.save(inscricao);

        return mapearParaDTO(turma, aluno);
    }

    /** Sai da turma. As entregas e notas ficam com a turma (o professor segue vendo o historico). */
    @Transactional
    public void sairDaTurma(UUID turmaId, Usuario aluno) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        if (turma.getProfessor().getId().equals(aluno.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "O professor não sai da própria turma.");
        }

        Inscricao inscricao = inscricaoRepository.findByTurmaIdAndAlunoId(turmaId, aluno.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));
        inscricaoRepository.delete(inscricao);
    }

    private ResponseTurmaDTO mapearParaDTO(Turma turma, Usuario usuario) {
        boolean isProfessor = turma.getProfessor().getId().equals(usuario.getId());

        String codigo = isProfessor ? turma.getCodigo() : null;
        Integer pendentes = null;
        Integer atrasadas = null;

        if (!isProfessor) {
            List<Atividade> atividades = atividadeRepository.findByTurmaId(turma.getId());
            LocalDateTime agora = LocalDateTime.now();
            int countPendentes = 0;
            int countAtrasadas = 0;

            for (Atividade a : atividades) {
                if (a.getDisponivelEm().isAfter(agora)) {
                    continue;
                }
                Optional<EntregaIndividual> entrega = entregaRepository.findByAtividadeIdAndAlunoId(a.getId(), usuario.getId());
                boolean entregue = entrega.isPresent();

                if (!entregue) {
                    if (agora.isAfter(a.getPrazoFinal())) {
                        countAtrasadas++;
                    } else {
                        countPendentes++;
                    }
                }
            }
            pendentes = countPendentes;
            atrasadas = countAtrasadas;
        }

        return new ResponseTurmaDTO(
                turma.getId(),
                turma.getProfessor().getId(),
                turma.getProfessor().getNome(),
                turma.getNome(),
                turma.getDisciplina(),
                turma.getSemestre(),
                turma.getDiasAula() != null ? new ArrayList<>(turma.getDiasAula()) : new ArrayList<>(),
                codigo,
                turma.getDescricao(),
                pendentes,
                atrasadas
        );
    }

    private String gerarCodigoUnico() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CARACTERES_CODIGO.charAt(RANDOM.nextInt(CARACTERES_CODIGO.length())));
            }
            codigo = sb.toString();
        } while (turmaRepository.existsByCodigo(codigo));
        return codigo;
    }
}

package com.narniano.rural_sala_de_aula.classes.grupo;

import com.narniano.rural_sala_de_aula.classes.inscricao.Inscricao;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.classes.usuario.UsuarioRepository;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.exception.ErrorResponseDTO.CampoErroDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Grupos da turma: solicitar e participar (RF06), sair (RF07) e configurar e aprovar (RF12). */
@Service
@RequiredArgsConstructor
public class GrupoService {

    private static final ConfiguracaoGruposDTO PADRAO = new ConfiguracaoGruposDTO(2, 5, null);

    private final GrupoRepository grupoRepository;
    private final GrupoIntegranteRepository integranteRepository;
    private final ConfiguracaoGruposRepository configuracaoRepository;
    private final TurmaRepository turmaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final UsuarioRepository usuarioRepository;

    // ---------- configuração (RF12) ----------

    @Transactional(readOnly = true)
    public ConfiguracaoGruposDTO obterConfiguracao(UUID turmaId, Usuario usuario) {
        Turma turma = turma(turmaId);
        exigirMembro(turma, usuario);
        return configuracaoDa(turmaId);
    }

    @Transactional
    public ConfiguracaoGruposDTO configurar(UUID turmaId, ConfiguracaoGruposDTO dto, Usuario usuario) {
        Turma turma = turma(turmaId);
        if (!ehProfessor(turma, usuario)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Somente o professor da turma configura os grupos.");
        }
        List<CampoErroDTO> erros = new ArrayList<>();
        if (dto.minimoIntegrantes() < 1) {
            erros.add(new CampoErroDTO("minimoIntegrantes", "O mínimo de integrantes deve ser pelo menos 1."));
        }
        if (dto.maximoIntegrantes() < dto.minimoIntegrantes()) {
            erros.add(new CampoErroDTO("maximoIntegrantes", "O máximo de integrantes não pode ser menor que o mínimo."));
        }
        if (dto.maximoGrupos() != null && dto.maximoGrupos() < 1) {
            erros.add(new CampoErroDTO("maximoGrupos", "O limite de grupos deve ser pelo menos 1, ou fica em branco para não limitar."));
        }
        if (!erros.isEmpty()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Dados inválidos.", erros);
        }
        configuracaoRepository.save(new ConfiguracaoGrupos(turmaId, dto.minimoIntegrantes(), dto.maximoIntegrantes(), dto.maximoGrupos()));
        return new ConfiguracaoGruposDTO(dto.minimoIntegrantes(), dto.maximoIntegrantes(), dto.maximoGrupos());
    }

    // ---------- consultas ----------

    @Transactional(readOnly = true)
    public List<IntegranteGrupoDTO> listarAlunos(UUID turmaId, Usuario usuario) {
        Turma turma = turma(turmaId);
        exigirMembro(turma, usuario);
        Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        return inscricaoRepository.findByTurmaId(turmaId).stream()
                .map(Inscricao::getAluno)
                .sorted(Comparator.comparing(Usuario::getNome, collator))
                .map(a -> new IntegranteGrupoDTO(a.getId(), a.getNome()))
                .toList();
    }

    /** O professor vê todos os grupos; o aluno vê os aprovados e os próprios (em qualquer estado). */
    @Transactional(readOnly = true)
    public List<GrupoDTO> listar(UUID turmaId, Usuario usuario) {
        Turma turma = turma(turmaId);
        exigirMembro(turma, usuario);
        boolean professor = ehProfessor(turma, usuario);

        Map<UUID, List<GrupoIntegrante>> porGrupo = integranteRepository.findByGrupoTurmaIdOrderByEntrouEmAsc(turmaId).stream()
                .collect(Collectors.groupingBy(i -> i.getGrupo().getId()));

        return grupoRepository.findByTurmaId(turmaId).stream()
                .filter(g -> professor
                        || g.getStatus() == StatusGrupo.APROVADO
                        || porGrupo.getOrDefault(g.getId(), List.of()).stream().anyMatch(i -> i.getAluno().getId().equals(usuario.getId())))
                .sorted(Comparator.comparing(Grupo::getCriadoEm))
                .map(g -> paraDTO(g, porGrupo.getOrDefault(g.getId(), List.of()).stream().map(GrupoIntegrante::getAluno).toList()))
                .toList();
    }

    // ---------- RF06: solicitar e entrar ----------

    @Transactional
    public GrupoDTO solicitar(UUID turmaId, GrupoInputDTO dto, Usuario aluno) {
        Turma turma = turma(turmaId);
        if (!inscrito(turmaId, aluno)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Só alunos da turma pedem grupos.");
        }
        grupoRepository.travar("grupo:" + turmaId);

        String nome = dto.nome() == null ? "" : dto.nome().trim();
        if (nome.isEmpty() || nome.length() > 80) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Dados inválidos.",
                    List.of(new CampoErroDTO("nome", nome.isEmpty() ? "Informe o nome do grupo." : "O nome do grupo tem no máximo 80 caracteres.")));
        }

        LinkedHashSet<UUID> ids = new LinkedHashSet<>();
        ids.add(aluno.getId());
        if (dto.integrantesIds() != null) {
            ids.addAll(dto.integrantesIds());
        }
        ConfiguracaoGruposDTO regras = configuracaoDa(turmaId);
        if (ids.size() < regras.minimoIntegrantes()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "O grupo precisa de pelo menos " + regras.minimoIntegrantes() + " integrantes.");
        }
        if (ids.size() > regras.maximoIntegrantes()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "O grupo pode ter no máximo " + regras.maximoIntegrantes() + " integrantes.");
        }
        for (UUID id : ids) {
            if (!inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, id)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Todos os integrantes precisam ser alunos desta turma.");
            }
            if (integranteRepository.existsByGrupoTurmaIdAndAlunoIdAndGrupoStatusNot(turmaId, id, StatusGrupo.REPROVADO)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Algum integrante já está em um grupo desta turma, ou com solicitação pendente.");
            }
        }
        if (regras.maximoGrupos() != null
                && grupoRepository.countByTurmaIdAndStatusNot(turmaId, StatusGrupo.REPROVADO) >= regras.maximoGrupos()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "A turma já atingiu o limite de grupos.");
        }

        Map<UUID, Usuario> usuarios = usuarioRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Usuario::getId, Function.identity(), (a, b) -> a));
        usuarios.put(aluno.getId(), aluno);

        Grupo grupo = new Grupo();
        grupo.setTurma(turma);
        grupo.setNome(nome);
        grupo.setStatus(StatusGrupo.PENDENTE);
        grupo.setCriadoPor(aluno);
        Grupo salvo = grupoRepository.save(grupo);

        List<Usuario> integrantes = new ArrayList<>();
        for (UUID id : ids) {
            Usuario u = usuarios.get(id);
            integranteRepository.save(new GrupoIntegrante(salvo, u));
            integrantes.add(u);
        }
        return paraDTO(salvo, integrantes);
    }

    @Transactional
    public GrupoDTO entrar(UUID grupoId, Usuario aluno) {
        Grupo grupo = grupo(grupoId);
        UUID turmaId = grupo.getTurma().getId();
        if (!inscrito(turmaId, aluno)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Grupo não encontrado.");
        }
        grupoRepository.travar("grupo:" + turmaId);

        if (grupo.getStatus() != StatusGrupo.APROVADO) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Só é possível entrar em grupos aprovados.");
        }
        if (integranteRepository.existsByGrupoTurmaIdAndAlunoIdAndGrupoStatusNot(turmaId, aluno.getId(), StatusGrupo.REPROVADO)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Você já está em um grupo desta turma.");
        }
        if (integranteRepository.countByGrupoId(grupoId) >= configuracaoDa(turmaId).maximoIntegrantes()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Este grupo já está cheio.");
        }
        integranteRepository.save(new GrupoIntegrante(grupo, aluno));
        return paraDTO(grupo, integrantesDe(grupoId));
    }

    // ---------- RF07: sair ----------

    @Transactional
    public void sair(UUID grupoId, Usuario aluno) {
        Grupo grupo = grupo(grupoId);
        UUID turmaId = grupo.getTurma().getId();
        grupoRepository.travar("grupo:" + turmaId);

        GrupoIntegrante integrante = integranteRepository.findByGrupoIdAndAlunoId(grupoId, aluno.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Você não está neste grupo."));

        if (grupo.getStatus() == StatusGrupo.APROVADO) {
            int minimo = configuracaoDa(turmaId).minimoIntegrantes();
            if (integranteRepository.countByGrupoId(grupoId) - 1 < minimo) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "O grupo ficaria com menos de " + minimo + " integrantes. Peça ao professor para ajustar a regra.");
            }
        }
        integranteRepository.delete(integrante);
        if (integranteRepository.countByGrupoId(grupoId) == 0) {
            grupoRepository.delete(grupo);
        }
    }

    // ---------- RF12: aprovar ----------

    @Transactional
    public GrupoDTO decidir(UUID grupoId, boolean aprovado, Usuario professor) {
        Grupo grupo = grupo(grupoId);
        if (!ehProfessor(grupo.getTurma(), professor)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Somente o professor da turma decide sobre grupos.");
        }
        grupoRepository.travar("grupo:" + grupo.getTurma().getId());
        if (grupo.getStatus() != StatusGrupo.PENDENTE) {
            throw new AppException(HttpStatus.CONFLICT, "Este grupo já foi decidido.");
        }
        grupo.setStatus(aprovado ? StatusGrupo.APROVADO : StatusGrupo.REPROVADO);
        grupoRepository.save(grupo);
        return paraDTO(grupo, integrantesDe(grupoId));
    }

    // ---------- apoio ----------

    private Turma turma(UUID turmaId) {
        return turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));
    }

    private Grupo grupo(UUID grupoId) {
        return grupoRepository.findById(grupoId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Grupo não encontrado."));
    }

    private boolean ehProfessor(Turma turma, Usuario usuario) {
        return turma.getProfessor().getId().equals(usuario.getId());
    }

    private boolean inscrito(UUID turmaId, Usuario usuario) {
        return inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, usuario.getId());
    }

    private void exigirMembro(Turma turma, Usuario usuario) {
        if (!ehProfessor(turma, usuario) && !inscrito(turma.getId(), usuario)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Você não é membro desta turma.");
        }
    }

    private ConfiguracaoGruposDTO configuracaoDa(UUID turmaId) {
        return configuracaoRepository.findById(turmaId)
                .map(c -> new ConfiguracaoGruposDTO(c.getMinimoIntegrantes(), c.getMaximoIntegrantes(), c.getMaximoGrupos()))
                .orElse(PADRAO);
    }

    private List<Usuario> integrantesDe(UUID grupoId) {
        return integranteRepository.findByGrupoIdOrderByEntrouEmAsc(grupoId).stream().map(GrupoIntegrante::getAluno).toList();
    }

    private GrupoDTO paraDTO(Grupo g, List<Usuario> integrantes) {
        return new GrupoDTO(
                g.getId(),
                g.getTurma().getId(),
                g.getNome(),
                g.getStatus(),
                g.getCriadoPor() != null ? g.getCriadoPor().getId() : null,
                integrantes.stream().map(u -> new IntegranteGrupoDTO(u.getId(), u.getNome())).toList());
    }
}

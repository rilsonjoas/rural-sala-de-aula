package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioService;
import com.narniano.rural_sala_de_aula.classes.comentario.RequestComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.comentario.ResponseComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegrante;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegranteRepository;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoRepository;
import com.narniano.rural_sala_de_aula.classes.grupo.IntegranteGrupoDTO;
import com.narniano.rural_sala_de_aula.classes.grupo.StatusGrupo;
import com.narniano.rural_sala_de_aula.classes.usuario.UsuarioRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.notificacao.TipoNotificacao;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvisoService {

    private final AvisoRepository avisoRepository;
    private final ComentarioService comentarioService;
    private final TurmaRepository turmaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final NotificacaoService notificacaoService;
    private final GrupoRepository grupoRepository;
    private final GrupoIntegranteRepository integranteRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ResponseAvisoDTO criarAviso(UUID turmaId, RequestAvisoDTO dto, Usuario autor) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        validarMembroDaTurma(turma, autor);
        if (!turma.getProfessor().getId().equals(autor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Só quem leciona a turma pode publicar avisos.");
        }

        Set<UUID> destinatarios = resolverDestinatarios(turma, dto);
        boolean direcionado = !destinatarios.isEmpty();

        Aviso aviso = new Aviso();
        aviso.setTurma(turma);
        aviso.setAutor(autor);
        aviso.setTexto(dto.texto().trim());
        aviso.setHorario(LocalDateTime.now());
        aviso.setAlcance(direcionado ? AlcanceAviso.DIRECIONADO : AlcanceAviso.TURMA);
        aviso.setDestinatarios(destinatarios);

        Aviso salvo = avisoRepository.save(aviso);
        String texto = "Novo aviso em " + turma.getNome() + ".";
        List<IntegranteGrupoDTO> nomes = null;
        if (direcionado) {
            List<Usuario> alunos = usuarioRepository.findAllById(destinatarios);
            alunos.forEach(a -> notificacaoService.notificar(a, TipoNotificacao.AVISO_NOVO, texto, turma, null, salvo));
            nomes = alunos.stream().map(a -> new IntegranteGrupoDTO(a.getId(), a.getNome())).toList();
        } else {
            notificacaoService.notificarAlunosDaTurma(turma, autor, TipoNotificacao.AVISO_NOVO, texto, null, salvo);
        }
        return new ResponseAvisoDTO(
                salvo.getId(),
                turma.getId(),
                autor.getId(),
                autor.getNome(),
                salvo.getTexto(),
                salvo.getHorario(),
                Collections.emptyList(),
                direcionado,
                nomes
        );
    }

    /** Alunos dos grupos escolhidos mais os alunos escolhidos; vazio quando o aviso é para a turma toda. */
    private Set<UUID> resolverDestinatarios(Turma turma, RequestAvisoDTO dto) {
        List<UUID> gruposIds = dto.gruposIds() == null ? List.of() : dto.gruposIds();
        List<UUID> alunosIds = dto.alunosIds() == null ? List.of() : dto.alunosIds();
        if (gruposIds.isEmpty() && alunosIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Set<UUID> resultado = new LinkedHashSet<>();
        Map<UUID, Grupo> gruposDaTurma = grupoRepository.findByTurmaId(turma.getId()).stream()
                .filter(g -> g.getStatus() != StatusGrupo.REPROVADO)
                .collect(Collectors.toMap(Grupo::getId, g -> g));
        for (UUID grupoId : gruposIds) {
            if (!gruposDaTurma.containsKey(grupoId)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Um dos grupos escolhidos não existe nesta turma.");
            }
            integranteRepository.findByGrupoIdOrderByEntrouEmAsc(grupoId).forEach(i -> resultado.add(i.getAluno().getId()));
        }
        for (UUID alunoId : alunosIds) {
            if (!inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), alunoId)) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Todos os destinatários precisam ser alunos desta turma.");
            }
            resultado.add(alunoId);
        }
        if (resultado.isEmpty()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Os grupos escolhidos não têm alunos para receber o aviso.");
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<ResponseAvisoDTO> listarPorTurma(UUID turmaId, Usuario usuario) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        validarMembroDaTurma(turma, usuario);

        boolean professor = turma.getProfessor().getId().equals(usuario.getId());
        List<Aviso> avisos = avisoRepository.findByTurmaIdOrderByHorarioDesc(turmaId);
        return avisos.stream()
                .filter(a -> professor || podeVer(a, usuario))
                .map(a -> {
                    List<ResponseComentarioDTO> comentarios = comentarioService.listarDoAviso(a.getId());
                    boolean direcionado = a.getAlcance() == AlcanceAviso.DIRECIONADO;
                    List<IntegranteGrupoDTO> nomes = professor && direcionado
                            ? usuarioRepository.findAllById(a.getDestinatarios()).stream()
                                    .map(u -> new IntegranteGrupoDTO(u.getId(), u.getNome())).toList()
                            : null;
                    return new ResponseAvisoDTO(
                            a.getId(),
                            turma.getId(),
                            a.getAutor().getId(),
                            a.getAutor().getNome(),
                            a.getTexto(),
                            a.getHorario(),
                            comentarios,
                            direcionado,
                            nomes
                    );
                })
                .toList();
    }

    /** Aviso da turma toda, ou direcionado a este usuário (o professor da turma vê todos, tratado à parte). */
    private boolean podeVer(Aviso aviso, Usuario usuario) {
        return aviso.getAlcance() != AlcanceAviso.DIRECIONADO
                || aviso.getAutor().getId().equals(usuario.getId())
                || aviso.getDestinatarios().contains(usuario.getId());
    }

    private void exigirVisivel(Aviso aviso, Usuario usuario) {
        boolean professor = aviso.getTurma().getProfessor().getId().equals(usuario.getId());
        if (!professor && !podeVer(aviso, usuario)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Aviso não encontrado.");
        }
    }

    @Transactional
    public ResponseComentarioDTO criarComentario(UUID avisoId, RequestComentarioDTO dto, Usuario autor) {
        Aviso aviso = avisoRepository.findById(avisoId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Aviso não encontrado."));

        validarMembroDaTurma(aviso.getTurma(), autor);
        exigirVisivel(aviso, autor);

        return comentarioService.criarNoAviso(aviso, dto, autor);
    }

    @Transactional(readOnly = true)
    public List<ResponseComentarioDTO> listarComentarios(UUID avisoId, Usuario usuario) {
        Aviso aviso = avisoRepository.findById(avisoId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Aviso não encontrado."));

        validarMembroDaTurma(aviso.getTurma(), usuario);
        exigirVisivel(aviso, usuario);

        return comentarioService.listarDoAviso(avisoId);
    }

    private void validarMembroDaTurma(Turma turma, Usuario usuario) {
        boolean isProfessor = turma.getProfessor().getId().equals(usuario.getId());
        boolean isAluno = inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), usuario.getId());
        if (!isProfessor && !isAluno) {
            throw new AppException(HttpStatus.FORBIDDEN, "Você não faz parte desta turma.");
        }
    }
}

package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioService;
import com.narniano.rural_sala_de_aula.classes.comentario.RequestComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.comentario.ResponseComentarioDTO;
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

    @Transactional
    public ResponseAvisoDTO criarAviso(UUID turmaId, RequestAvisoDTO dto, Usuario autor) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        validarMembroDaTurma(turma, autor);
        if (!turma.getProfessor().getId().equals(autor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Só quem leciona a turma pode publicar avisos.");
        }

        Aviso aviso = new Aviso();
        aviso.setTurma(turma);
        aviso.setAutor(autor);
        aviso.setTexto(dto.texto().trim());
        aviso.setHorario(LocalDateTime.now());

        Aviso salvo = avisoRepository.save(aviso);
        notificacaoService.notificarAlunosDaTurma(turma, autor, TipoNotificacao.AVISO_NOVO,
                "Novo aviso em " + turma.getNome() + ".", null, salvo);
        return new ResponseAvisoDTO(
                salvo.getId(),
                turma.getId(),
                autor.getId(),
                autor.getNome(),
                salvo.getTexto(),
                salvo.getHorario(),
                Collections.emptyList()
        );
    }

    @Transactional(readOnly = true)
    public List<ResponseAvisoDTO> listarPorTurma(UUID turmaId, Usuario usuario) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        validarMembroDaTurma(turma, usuario);

        List<Aviso> avisos = avisoRepository.findByTurmaIdOrderByHorarioDesc(turmaId);
        return avisos.stream()
                .map(a -> {
                    List<ResponseComentarioDTO> comentarios = comentarioService.listarDoAviso(a.getId());

                    return new ResponseAvisoDTO(
                            a.getId(),
                            turma.getId(),
                            a.getAutor().getId(),
                            a.getAutor().getNome(),
                            a.getTexto(),
                            a.getHorario(),
                            comentarios
                    );
                })
                .toList();
    }

    @Transactional
    public ResponseComentarioDTO criarComentario(UUID avisoId, RequestComentarioDTO dto, Usuario autor) {
        Aviso aviso = avisoRepository.findById(avisoId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Aviso não encontrado."));

        validarMembroDaTurma(aviso.getTurma(), autor);

        return comentarioService.criarNoAviso(aviso, dto, autor);
    }

    @Transactional(readOnly = true)
    public List<ResponseComentarioDTO> listarComentarios(UUID avisoId, Usuario usuario) {
        Aviso aviso = avisoRepository.findById(avisoId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Aviso não encontrado."));

        validarMembroDaTurma(aviso.getTurma(), usuario);

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

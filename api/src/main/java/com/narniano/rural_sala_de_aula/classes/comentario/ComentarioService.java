package com.narniano.rural_sala_de_aula.classes.comentario;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.notificacao.TipoNotificacao;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final AtividadeRepository atividadeRepository;
    private final InscricaoRepository inscricaoRepository;
    private final NotificacaoService notificacaoService;

    @Transactional
    public ResponseComentarioDTO criarNoAviso(Aviso aviso, RequestComentarioDTO dto, Usuario autor) {
        Comentario comentario = new Comentario();
        Comentario respondido = null;
        if (dto.comentarioPaiId() != null) {
            Comentario pai = comentarioRepository.findById(dto.comentarioPaiId())
                    .filter(c -> c.getAviso() != null && c.getAviso().getId().equals(aviso.getId()))
                    .orElseThrow(() -> new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "O comentário respondido não existe neste aviso."));
            respondido = pai;
            // so um nivel de resposta: responder a uma resposta vira resposta ao comentario original
            comentario.setComentarioPai(pai.getComentarioPai() != null ? pai.getComentarioPai() : pai);
        }
        comentario.setAviso(aviso);
        comentario.setUsuario(autor);
        comentario.setTexto(dto.texto().trim());
        comentario.setHorario(LocalDateTime.now());
        Comentario salvo = comentarioRepository.save(comentario);
        notificarComentario(autor, aviso.getTurma(), null, aviso, respondido, "no mural de " + aviso.getTurma().getNome());
        return paraDTO(salvo);
    }

    @Transactional(readOnly = true)
    public List<ResponseComentarioDTO> listarDoAviso(UUID avisoId) {
        return comentarioRepository.findByAvisoIdOrderByHorarioAsc(avisoId).stream()
                .map(this::paraDTO)
                .toList();
    }

    @Transactional
    public ResponseComentarioDTO criarNaAtividade(UUID atividadeId, RequestComentarioDTO dto, Usuario autor) {
        Atividade atividade = atividadeAcessivel(atividadeId, autor);
        Comentario comentario = new Comentario();
        Comentario respondido = null;
        if (dto.comentarioPaiId() != null) {
            Comentario pai = comentarioRepository.findById(dto.comentarioPaiId())
                    .filter(c -> c.getAtividade() != null && c.getAtividade().getId().equals(atividadeId))
                    .orElseThrow(() -> new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "O comentário respondido não existe nesta atividade."));
            respondido = pai;
            comentario.setComentarioPai(pai.getComentarioPai() != null ? pai.getComentarioPai() : pai);
        }
        comentario.setAtividade(atividade);
        comentario.setUsuario(autor);
        comentario.setTexto(dto.texto().trim());
        comentario.setHorario(LocalDateTime.now());
        Comentario salvo = comentarioRepository.save(comentario);
        notificarComentario(autor, atividade.getTurma(), atividade, null, respondido, "na atividade " + atividade.getNome());
        return paraDTO(salvo);
    }

    @Transactional(readOnly = true)
    public List<ResponseComentarioDTO> listarDaAtividade(UUID atividadeId, Usuario usuario) {
        atividadeAcessivel(atividadeId, usuario);
        return comentarioRepository.findByAtividadeIdOrderByHorarioAsc(atividadeId).stream()
                .map(this::paraDTO)
                .toList();
    }

    // professor da turma, ou aluno inscrito com a atividade ja disponivel; os demais veem 404
    private Atividade atividadeAcessivel(UUID atividadeId, Usuario usuario) {
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));
        UUID turmaId = atividade.getTurma().getId();
        boolean professor = atividade.getTurma().getProfessor().getId().equals(usuario.getId());
        boolean aluno = inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, usuario.getId());
        if (!professor && !aluno) {
            throw new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada.");
        }
        if (!professor && atividade.getDisponivelEm().isAfter(LocalDateTime.now())) {
            throw new AppException(HttpStatus.NOT_FOUND, "Atividade ainda não disponível.");
        }
        return atividade;
    }

    // resposta: avisa o autor do comentario respondido; comentario de aluno sem pai: avisa o professor;
    // comentario do professor sem pai nao tem destinatario claro e nao avisa ninguem
    private void notificarComentario(Usuario autor, Turma turma, Atividade atividade, Aviso aviso, Comentario respondido, String alvo) {
        if (respondido != null) {
            Usuario destinatario = respondido.getUsuario();
            if (!destinatario.getId().equals(autor.getId())) {
                notificacaoService.notificar(destinatario, TipoNotificacao.RESPOSTA_NOVA,
                        autor.getNome() + " respondeu ao seu comentário.", turma, atividade, aviso);
            }
        } else if (!turma.getProfessor().getId().equals(autor.getId())) {
            notificacaoService.notificar(turma.getProfessor(), TipoNotificacao.COMENTARIO_NOVO,
                    autor.getNome() + " comentou " + alvo + ".", turma, atividade, aviso);
        }
    }

    public ResponseComentarioDTO paraDTO(Comentario c) {
        return new ResponseComentarioDTO(
                c.getId(),
                c.getAviso() != null ? c.getAviso().getId() : null,
                c.getAtividade() != null ? c.getAtividade().getId() : null,
                c.getComentarioPai() != null ? c.getComentarioPai().getId() : null,
                c.getUsuario().getId(),
                c.getUsuario().getNome(),
                c.getTexto(),
                c.getHorario()
        );
    }
}

package com.narniano.rural_sala_de_aula.classes.comentario;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.notificacao.TipoNotificacao;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** RF14: comentários e respostas em atividade (regras do ComentarioService, sem banco). */
@ExtendWith(MockitoExtension.class)
class ComentarioServiceTest {

    @Mock ComentarioRepository comentarioRepository;
    @Mock AtividadeRepository atividadeRepository;
    @Mock InscricaoRepository inscricaoRepository;
    @Mock NotificacaoService notificacaoService;
    @InjectMocks ComentarioService service;

    private Usuario professor;
    private Usuario aluno;
    private Turma turma;
    private Atividade atividade;

    @BeforeEach
    void cenario() {
        professor = usuario("Helena");
        aluno = usuario("Ana");
        turma = new Turma();
        turma.setId(UUID.randomUUID());
        turma.setNome("Turma A");
        turma.setProfessor(professor);
        atividade = new Atividade();
        atividade.setId(UUID.randomUUID());
        atividade.setNome("Lista 1");
        atividade.setTurma(turma);
        atividade.setDisponivelEm(LocalDateTime.now().minusDays(1));
    }

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    private Comentario comentarioNaAtividade(Usuario autor, Comentario pai) {
        Comentario c = new Comentario();
        c.setId(UUID.randomUUID());
        c.setAtividade(atividade);
        c.setComentarioPai(pai);
        c.setUsuario(autor);
        c.setTexto("texto");
        return c;
    }

    private void alunoInscrito() {
        when(atividadeRepository.findById(atividade.getId())).thenReturn(Optional.of(atividade));
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), aluno.getId())).thenReturn(true);
    }

    private void salvando() {
        when(comentarioRepository.save(any(Comentario.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void comentario_de_aluno_sem_pai_e_salvo_sem_espacos_nas_pontas_e_avisa_o_professor() {
        alunoInscrito();
        salvando();

        ResponseComentarioDTO resposta = service.criarNaAtividade(
                atividade.getId(), new RequestComentarioDTO("  Posso entregar em dupla?  ", null), aluno);

        assertEquals("Posso entregar em dupla?", resposta.texto());
        assertEquals(atividade.getId(), resposta.atividadeId());
        verify(notificacaoService).notificar(eq(professor), eq(TipoNotificacao.COMENTARIO_NOVO),
                eq("Ana comentou na atividade Lista 1."), eq(turma), eq(atividade), eq(null));
    }

    @Test
    void comentario_do_professor_sem_pai_nao_avisa_ninguem() {
        when(atividadeRepository.findById(atividade.getId())).thenReturn(Optional.of(atividade));
        when(comentarioRepository.save(any(Comentario.class))).thenAnswer(i -> i.getArgument(0));

        service.criarNaAtividade(atividade.getId(), new RequestComentarioDTO("Aviso geral", null), professor);

        verify(notificacaoService, never()).notificar(any(), any(), anyString(), any(), any(), any());
    }

    @Test
    void resposta_avisa_o_autor_do_comentario_respondido_e_nao_a_quem_respondeu_a_si_mesmo() {
        alunoInscrito();
        salvando();
        Comentario daAluna = comentarioNaAtividade(aluno, null);
        when(comentarioRepository.findById(daAluna.getId())).thenReturn(Optional.of(daAluna));

        // a própria aluna responde ao seu comentário: ninguém é avisado
        service.criarNaAtividade(atividade.getId(), new RequestComentarioDTO("Esqueci de dizer", daAluna.getId()), aluno);
        verify(notificacaoService, never()).notificar(any(), any(), anyString(), any(), any(), any());

        // a professora responde: a aluna é avisada com RESPOSTA_NOVA
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), professor.getId())).thenReturn(false);
        service.criarNaAtividade(atividade.getId(), new RequestComentarioDTO("Pode, sim", daAluna.getId()), professor);
        verify(notificacaoService).notificar(eq(aluno), eq(TipoNotificacao.RESPOSTA_NOVA),
                eq("Helena respondeu ao seu comentário."), eq(turma), eq(atividade), eq(null));
    }

    @Test
    void responder_a_uma_resposta_vira_resposta_ao_comentario_original() {
        alunoInscrito();
        salvando();
        Comentario original = comentarioNaAtividade(aluno, null);
        Comentario resposta = comentarioNaAtividade(professor, original);
        when(comentarioRepository.findById(resposta.getId())).thenReturn(Optional.of(resposta));

        service.criarNaAtividade(atividade.getId(), new RequestComentarioDTO("Obrigada", resposta.getId()), aluno);

        ArgumentCaptor<Comentario> salvo = ArgumentCaptor.forClass(Comentario.class);
        verify(comentarioRepository).save(salvo.capture());
        assertSame(original, salvo.getValue().getComentarioPai());
    }

    @Test
    void recusa_com_422_resposta_a_comentario_de_outra_atividade() {
        alunoInscrito();
        Atividade outra = new Atividade();
        outra.setId(UUID.randomUUID());
        Comentario deOutra = comentarioNaAtividade(professor, null);
        deOutra.setAtividade(outra);
        when(comentarioRepository.findById(deOutra.getId())).thenReturn(Optional.of(deOutra));

        AppException erro = assertThrows(AppException.class, () ->
                service.criarNaAtividade(atividade.getId(), new RequestComentarioDTO("Oi", deOutra.getId()), aluno));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatus());
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void aluno_de_fora_da_turma_e_aluno_com_atividade_indisponivel_recebem_404_mas_o_professor_acessa() {
        when(atividadeRepository.findById(atividade.getId())).thenReturn(Optional.of(atividade));
        Usuario forasteiro = usuario("Bia");
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), forasteiro.getId())).thenReturn(false);

        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class,
                () -> service.listarDaAtividade(atividade.getId(), forasteiro)).getStatus());

        atividade.setDisponivelEm(LocalDateTime.now().plusDays(2));
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), aluno.getId())).thenReturn(true);
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class,
                () -> service.listarDaAtividade(atividade.getId(), aluno)).getStatus());

        when(comentarioRepository.findByAtividadeIdOrderByHorarioAsc(atividade.getId())).thenReturn(java.util.List.of());
        assertEquals(0, service.listarDaAtividade(atividade.getId(), professor).size());
    }
}

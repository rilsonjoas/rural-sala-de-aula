package com.narniano.rural_sala_de_aula.classes.notificacao;

import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.Inscricao;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacaoServiceTest {

    @Mock NotificacaoRepository notificacaoRepository;
    @Mock InscricaoRepository inscricaoRepository;
    @Mock TurmaRepository turmaRepository;
    @Mock AtividadeRepository atividadeRepository;
    @Mock EntregaIndividualRepository entregaRepository;
    @Mock JdbcTemplate jdbcTemplate;
    @InjectMocks NotificacaoService service;

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    @Test
    void notificarAlunosDaTurma_exclui_o_autor() {
        Usuario professor = usuario("Paulo");
        Usuario a1 = usuario("A1");
        Usuario a2 = usuario("A2");
        Usuario autor = usuario("Autor");
        Turma turma = new Turma();
        turma.setId(UUID.randomUUID());
        turma.setProfessor(professor);
        when(inscricaoRepository.findByTurmaId(turma.getId()))
                .thenReturn(List.of(new Inscricao(turma, a1), new Inscricao(turma, autor), new Inscricao(turma, a2)));

        service.notificarAlunosDaTurma(turma, autor, TipoNotificacao.AVISO_NOVO, "Novo aviso.", null, null);

        ArgumentCaptor<Notificacao> salvas = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository, times(2)).save(salvas.capture());
        List<UUID> destinatarios = salvas.getAllValues().stream().map(n -> n.getUsuario().getId()).toList();
        assertEquals(List.of(a1.getId(), a2.getId()), destinatarios);
        assertTrue(salvas.getAllValues().stream().allMatch(n -> n.getTipo() == TipoNotificacao.AVISO_NOVO && n.getLidaEm() == null));
    }

    @Test
    void notificar_corta_o_texto_em_300_caracteres() {
        Usuario destinatario = usuario("Aluno");
        Turma turma = new Turma();
        turma.setId(UUID.randomUUID());

        service.notificar(destinatario, TipoNotificacao.AVISO_NOVO, "x".repeat(500), turma, null, null);

        ArgumentCaptor<Notificacao> salva = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository).save(salva.capture());
        assertEquals(300, salva.getValue().getTexto().length());
    }
}

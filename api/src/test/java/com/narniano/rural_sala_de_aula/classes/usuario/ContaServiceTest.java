package com.narniano.rural_sala_de_aula.classes.usuario;

import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.security.PasswordEncoderUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Excluir a própria conta: exige a senha, não vale para quem leciona e leva junto as entregas e comentários (sem banco). */
@ExtendWith(MockitoExtension.class)
class ContaServiceTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock TurmaRepository turmaRepository;
    @Mock EntregaIndividualRepository entregaRepository;
    @Mock ArquivoRepository arquivoRepository;
    @Mock ComentarioRepository comentarioRepository;
    @InjectMocks ContaService service;

    private Usuario ana;

    @BeforeEach
    void cenario() {
        ana = new Usuario();
        ana.setId(UUID.randomUUID());
        ana.setNome("Ana");
        ana.setSenha(PasswordEncoderUtil.encode("senha-certa-1"));
    }

    @Test
    void com_a_senha_certa_apaga_entregas_comentarios_e_a_conta() {
        EntregaIndividual entrega = new EntregaIndividual();
        entrega.setId(UUID.randomUUID());
        when(turmaRepository.findByProfessorId(ana.getId())).thenReturn(List.of());
        when(entregaRepository.findByAlunoId(ana.getId())).thenReturn(List.of(entrega));
        when(arquivoRepository.findByEntregaId(entrega.getId())).thenReturn(List.of());

        service.excluirConta(ana, "senha-certa-1");

        verify(entregaRepository).deleteAll(List.of(entrega));
        verify(comentarioRepository).deleteByUsuarioId(ana.getId());
        verify(usuarioRepository).delete(ana);
    }

    @Test
    void senha_errada_devolve_403_e_nada_e_apagado() {
        AppException erro = assertThrows(AppException.class, () -> service.excluirConta(ana, "errada"));

        assertEquals(HttpStatus.FORBIDDEN, erro.getStatus());
        verify(usuarioRepository, never()).delete(ana);
    }

    @Test
    void quem_leciona_turmas_recebe_409_com_o_aviso_de_excluir_as_turmas_antes() {
        when(turmaRepository.findByProfessorId(ana.getId())).thenReturn(List.of(new Turma(), new Turma()));

        AppException erro = assertThrows(AppException.class, () -> service.excluirConta(ana, "senha-certa-1"));

        assertEquals(HttpStatus.CONFLICT, erro.getStatus());
        assertEquals(true, erro.getMessage().contains("2 turmas"));
        verify(usuarioRepository, never()).delete(ana);
    }
}

package com.narniano.rural_sala_de_aula.classes.turma;

import com.narniano.rural_sala_de_aula.classes.usuario.AuthService;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/*
Foram realizados testes unitários dos três métodos do TurmaController:

    listagem de turmas
    cadastro de uma nova turma
    obtenção dos detalhes de uma turma

    Os testes verificam a:

    autenticação do usuário
    as chamadas ao TurmaService
    códigos HTTP retornados
 */

@ExtendWith(MockitoExtension.class)
class TurmaControllerTest {

    @Mock private TurmaService turmaService;
    @Mock private AuthService authService;
    @Mock private HttpSession session;
    @Mock private Usuario usuario;

    @InjectMocks private TurmaController turmaController;

    @Test
    void deveListarTurmas() {
        String semestre = "2026.2";
        List<ResponseTurmaDTO> turmas = List.of(
                mock(ResponseTurmaDTO.class),
                mock(ResponseTurmaDTO.class)
        );

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(turmaService.listarMinhasTurmas(usuario, semestre)).thenReturn(turmas);

        ResponseEntity<List<ResponseTurmaDTO>> response =
                turmaController.listarTurmas(semestre, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(turmas, response.getBody());

        verify(authService).getUsuarioAutenticado(session);
        verify(turmaService).listarMinhasTurmas(usuario, semestre);
    }

    @Test
    void deveCadastrarTurma() {
        RequestTurmaDTO request = mock(RequestTurmaDTO.class);
        ResponseTurmaDTO turma = mock(ResponseTurmaDTO.class);

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(turmaService.cadastrar(request, usuario)).thenReturn(turma);

        ResponseEntity<ResponseTurmaDTO> response =
                turmaController.cadastrarTurma(request, session);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(turma, response.getBody());

        verify(authService).getUsuarioAutenticado(session);
        verify(turmaService).cadastrar(request, usuario);
    }

    @Test
    void deveObterTurma() {
        UUID turmaId = UUID.randomUUID();
        ResponseTurmaDTO turma = mock(ResponseTurmaDTO.class);

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(turmaService.obterDetalhe(turmaId, usuario)).thenReturn(turma);

        ResponseEntity<ResponseTurmaDTO> response =
                turmaController.obterTurma(turmaId, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(turma, response.getBody());

        verify(authService).getUsuarioAutenticado(session);
        verify(turmaService).obterDetalhe(turmaId, usuario);
    }
}

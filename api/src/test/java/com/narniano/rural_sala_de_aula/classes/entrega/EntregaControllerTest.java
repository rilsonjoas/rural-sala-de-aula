package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.usuario.AuthService;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/*
Foram realizados testes unitários dos principais métodos do EntregaController:

    envio de entrega
    listagem de entregas
    avaliação dos arquivos
    download dos arquivos

Os testes verificam se o controller chama corretamente os serviços responsáveis
e se retorna os códigos HTTP, dados e cabeçalhos esperados.
 */

@ExtendWith(MockitoExtension.class)
class EntregaControllerTest {

    @Mock private EntregaService entregaService;
    @Mock private AuthService authService;
    @Mock private HttpSession session;
    @Mock private Usuario usuario;

    @InjectMocks private EntregaController entregaController;

    private UUID atividadeId;
    private UUID entregaId;

    @BeforeEach
    void setUp() {
        atividadeId = UUID.randomUUID();
        entregaId = UUID.randomUUID();
    }

    @Test
    void deveEnviarEntrega() {
        MultipartFile arquivo = new MockMultipartFile(
                "arquivo", "atividade.pdf", "application/pdf", "teste".getBytes());
        ResponseEntregaIndividualDTO entrega = mock(ResponseEntregaIndividualDTO.class);

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(entregaService.enviar(atividadeId, arquivo, usuario)).thenReturn(entrega);

        ResponseEntity<ResponseEntregaIndividualDTO> response =
                entregaController.enviar(atividadeId, arquivo, session);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(entrega, response.getBody());
        verify(authService).getUsuarioAutenticado(session);
        verify(entregaService).enviar(atividadeId, arquivo, usuario);
    }

    @Test
    void deveListarEntregas() {
        List<ResponseEntregaIndividualDTO> entregas = List.of(
                mock(ResponseEntregaIndividualDTO.class),
                mock(ResponseEntregaIndividualDTO.class));

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(entregaService.listarPorAtividade(atividadeId, usuario)).thenReturn(entregas);

        ResponseEntity<List<ResponseEntregaIndividualDTO>> response =
                entregaController.listarPorAtividade(atividadeId, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(entregas, response.getBody());
        verify(authService).getUsuarioAutenticado(session);
        verify(entregaService).listarPorAtividade(atividadeId, usuario);
    }

    @Test
    void deveAvaliarEntrega() {
        AvaliacaoInputDTO dto = mock(AvaliacaoInputDTO.class);
        ResponseEntregaIndividualDTO entrega = mock(ResponseEntregaIndividualDTO.class);

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(entregaService.avaliar(entregaId, dto, usuario)).thenReturn(entrega);

        ResponseEntity<ResponseEntregaIndividualDTO> response =
                entregaController.avaliar(entregaId, dto, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(entrega, response.getBody());
        verify(entregaService).avaliar(entregaId, dto, usuario);
    }

    @Test
    void deveBaixarArquivo() {
        Arquivo arquivo = mock(Arquivo.class);
        byte[] bytes = "teste".getBytes();

        when(authService.getUsuarioAutenticado(session)).thenReturn(usuario);
        when(arquivo.getNomeOriginal()).thenReturn("atividade.pdf");
        when(arquivo.getTipoConteudo()).thenReturn("application/pdf");
        when(entregaService.baixarArquivo(entregaId, usuario))
                .thenReturn(Map.entry(arquivo, bytes));

        ResponseEntity<byte[]> response =
                entregaController.baixarArquivo(entregaId, session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertArrayEquals(bytes, response.getBody());
        assertEquals("attachment; filename=\"atividade.pdf\"",
                response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertEquals(bytes.length, response.getHeaders().getContentLength());

        verify(entregaService).baixarArquivo(entregaId, usuario);
    }
}
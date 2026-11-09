package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeService;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/*
Foram realizados testes unitários das principais funcionalidades e validações do EntregaService.
Os testes verificam situações como:

    arquivos inválidos
    tamanho máximo permitido
    extensões não aceitas
    permissões de acesso
    listagem e avaliação de entregas
    download autorizado e não autorizado de arquivos
 */

@ExtendWith(MockitoExtension.class)
class EntregaServiceTest {

    @Mock private EntregaIndividualRepository entregaRepository;
    @Mock private AtividadeRepository atividadeRepository;
    @Mock private InscricaoRepository inscricaoRepository;
    @Mock private ArquivoRepository arquivoRepository;
    @Mock private AtividadeService atividadeService;
    @Mock private NotificacaoService notificacaoService;
    @Mock private Usuario aluno;
    @Mock private Usuario professor;

    @InjectMocks private EntregaService entregaService;

    private UUID atividadeId;
    private UUID entregaId;

    @BeforeEach
    void setUp() {
        atividadeId = UUID.randomUUID();
        entregaId = UUID.randomUUID();
    }

    @Test
    void deveRejeitarArquivoVazio() {
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo", new byte[0]);

        assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        verifyNoInteractions(atividadeRepository);
    }

    @Test
    void deveRejeitarArquivoMaiorQue25MB() {
        MockMultipartFile arquivo = mock(MockMultipartFile.class);

        when(arquivo.isEmpty()).thenReturn(false);
        when(arquivo.getSize()).thenReturn(26L * 1024 * 1024);

        assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        verifyNoInteractions(atividadeRepository);
    }

    @Test
    void deveRejeitarExtensaoNaoPermitida() {
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo", "arquivo.exe",
                "application/octet-stream", "teste".getBytes());

        assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        verifyNoInteractions(atividadeRepository);
    }

    @Test
    void deveListarEntregasDaAtividade() {
        Atividade atividade = mock(Atividade.class, RETURNS_DEEP_STUBS);
        EntregaIndividual entrega = mock(EntregaIndividual.class);
        ResponseEntregaIndividualDTO dto = mock(ResponseEntregaIndividualDTO.class);

        UUID professorId = UUID.randomUUID();

        when(professor.getId()).thenReturn(professorId);
        when(atividade.getTurma().getProfessor().getId()).thenReturn(professorId);
        when(atividadeRepository.findById(atividadeId)).thenReturn(Optional.of(atividade));
        when(entregaRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividadeId))
                .thenReturn(List.of(entrega));
        when(atividadeService.mapearEntregaParaDTO(entrega)).thenReturn(dto);

        List<ResponseEntregaIndividualDTO> resultado =
                entregaService.listarPorAtividade(atividadeId, professor);

        assertEquals(1, resultado.size());
        assertEquals(dto, resultado.getFirst());
        verify(entregaRepository).findByAtividadeIdOrderByEnviadaEmAsc(atividadeId);
    }

    @Test
    void deveImpedirProfessorNaoAutorizadoDeListar() {
        Atividade atividade = mock(Atividade.class, RETURNS_DEEP_STUBS);

        when(atividade.getTurma().getProfessor().getId()).thenReturn(UUID.randomUUID());
        when(professor.getId()).thenReturn(UUID.randomUUID());
        when(atividadeRepository.findById(atividadeId)).thenReturn(Optional.of(atividade));

        assertThrows(AppException.class,
                () -> entregaService.listarPorAtividade(atividadeId, professor));

        verifyNoInteractions(entregaRepository);
    }

    @Test
    void deveAvaliarEntrega() {
        EntregaIndividual entrega = mock(EntregaIndividual.class, RETURNS_DEEP_STUBS);
        AvaliacaoInputDTO avaliacao = mock(AvaliacaoInputDTO.class);
        ResponseEntregaIndividualDTO dto = mock(ResponseEntregaIndividualDTO.class);

        UUID professorId = UUID.randomUUID();

        when(professor.getId()).thenReturn(professorId);
        when(entrega.getAtividade().getTurma().getProfessor().getId()).thenReturn(professorId);
        when(entregaRepository.findById(entregaId)).thenReturn(Optional.of(entrega));
        when(entregaRepository.save(entrega)).thenReturn(entrega);
        when(atividadeService.mapearEntregaParaDTO(entrega)).thenReturn(dto);

        ResponseEntregaIndividualDTO resultado =
                entregaService.avaliar(entregaId, avaliacao, professor);

        assertEquals(dto, resultado);
        verify(entregaRepository).save(entrega);
        verify(atividadeService).mapearEntregaParaDTO(entrega);
    }

    @Test
    void deveImpedirPessoaNaoAutorizadaDeBaixarArquivo() {
        EntregaIndividual entrega = mock(EntregaIndividual.class, RETURNS_DEEP_STUBS);

        when(entrega.getAtividade().getTurma().getProfessor().getId())
                .thenReturn(UUID.randomUUID());
        when(entrega.getAluno().getId()).thenReturn(UUID.randomUUID());
        when(aluno.getId()).thenReturn(UUID.randomUUID());
        when(entregaRepository.findById(entregaId)).thenReturn(Optional.of(entrega));

        assertThrows(AppException.class,
                () -> entregaService.baixarArquivo(entregaId, aluno));

        verifyNoInteractions(arquivoRepository);
    }

    @Test
    void deveRetornarArquivoParaAluno() throws Exception {
        EntregaIndividual entrega = mock(EntregaIndividual.class, RETURNS_DEEP_STUBS);
        Arquivo arquivo = mock(Arquivo.class);

        UUID alunoId = UUID.randomUUID();
        Path caminho = Files.createTempFile("entrega", ".txt");
        byte[] conteudo = "teste".getBytes();

        Files.write(caminho, conteudo);

        when(aluno.getId()).thenReturn(alunoId);
        when(entrega.getAluno().getId()).thenReturn(alunoId);
        when(entregaRepository.findById(entregaId)).thenReturn(Optional.of(entrega));
        when(arquivoRepository.findByEntregaId(entregaId)).thenReturn(List.of(arquivo));
        when(arquivo.getCaminho()).thenReturn(caminho.toString());

        Map.Entry<Arquivo, byte[]> resultado =
                entregaService.baixarArquivo(entregaId, aluno);

        assertEquals(arquivo, resultado.getKey());
        assertArrayEquals(conteudo, resultado.getValue());

        Files.deleteIfExists(caminho);
    }
}
package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeService;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
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
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/*
 * Foram realizados testes unitários das principais funcionalidades e validações
 * do EntregaService, incluindo arquivos inválidos, tamanho e extensão,
 * permissões, listagem, avaliação e download autorizado ou não autorizado.
 */
@ExtendWith(MockitoExtension.class)
class TesteEntregaService {

    @Mock
    private EntregaIndividualRepository entregaRepository;

    @Mock
    private AtividadeRepository atividadeRepository;

    @Mock
    private InscricaoRepository inscricaoRepository;

    @Mock
    private ArquivoRepository arquivoRepository;

    @Mock
    private AtividadeService atividadeService;

    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private EntregaService entregaService;

    private UUID atividadeId;
    private UUID alunoId;
    private UUID professorId;

    @BeforeEach
    void setUp() {
        atividadeId = UUID.randomUUID();
        alunoId = UUID.randomUUID();
        professorId = UUID.randomUUID();
    }

    // Arquivo inválido ou não enviado
    @Test
    void deveRecusarArquivoVazio() {
        Usuario aluno = mock(Usuario.class);
        MockMultipartFile arquivo =
                new MockMultipartFile("arquivo", "teste.pdf",
                        "application/pdf", new byte[0]);

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.getStatus());
        verifyNoInteractions(atividadeRepository);
    }

    // Arquivo acima do limite de 25 MB
    @Test
    void deveRecusarArquivoMaiorQue25MB() {
        Usuario aluno = mock(Usuario.class);

        byte[] conteudo = new byte[25 * 1024 * 1024 + 1];

        MockMultipartFile arquivo =
                new MockMultipartFile("arquivo", "grande.pdf",
                        "application/pdf", conteudo);

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, exception.getStatus());
        verifyNoInteractions(atividadeRepository);
    }

    // Extensão não permitida
    @Test
    void deveRecusarExtensaoNaoPermitida() {
        Usuario aluno = mock(Usuario.class);

        MockMultipartFile arquivo =
                new MockMultipartFile("arquivo", "virus.exe",
                        "application/octet-stream", "conteudo".getBytes());

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, exception.getStatus());
        verifyNoInteractions(atividadeRepository);
    }

    // Aluno sem matrícula na turma
    @Test
    void deveRecusarAlunoNaoMatriculado() {
        Usuario aluno = mock(Usuario.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        when(aluno.getId()).thenReturn(alunoId);
        when(atividadeRepository.findById(atividadeId))
                .thenReturn(Optional.of(atividade));
        when(atividade.getTurma()).thenReturn(turma);
        when(turma.getId()).thenReturn(UUID.randomUUID());
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(any(), eq(alunoId)))
                .thenReturn(false);

        MockMultipartFile arquivo =
                new MockMultipartFile("arquivo", "teste.pdf",
                        "application/pdf", "conteudo".getBytes());

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.enviar(atividadeId, arquivo, aluno));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(entregaRepository, never()).save(any());
    }

    // Listagem permitida para o professor
    @Test
    void deveListarEntregasParaProfessorDaTurma() {
        Usuario professor = mock(Usuario.class);
        Usuario professorTurma = mock(Usuario.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        EntregaIndividual entrega1 = mock(EntregaIndividual.class);
        EntregaIndividual entrega2 = mock(EntregaIndividual.class);

        ResponseEntregaIndividualDTO dto1 = mock(ResponseEntregaIndividualDTO.class);
        ResponseEntregaIndividualDTO dto2 = mock(ResponseEntregaIndividualDTO.class);

        when(professor.getId()).thenReturn(professorId);
        when(professorTurma.getId()).thenReturn(professorId);
        when(atividadeRepository.findById(atividadeId))
                .thenReturn(Optional.of(atividade));

        when(atividade.getTurma()).thenReturn(turma);
        when(turma.getProfessor()).thenReturn(professorTurma);

        when(entregaRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividadeId))
                .thenReturn(List.of(entrega1, entrega2));

        when(atividadeService.mapearEntregaParaDTO(entrega1)).thenReturn(dto1);
        when(atividadeService.mapearEntregaParaDTO(entrega2)).thenReturn(dto2);

        List<ResponseEntregaIndividualDTO> resultado =
                entregaService.listarPorAtividade(atividadeId, professor);

        assertEquals(2, resultado.size());
        assertEquals(dto1, resultado.get(0));
        assertEquals(dto2, resultado.get(1));
    }

    // Usuário que não é professor não pode listar
    @Test
    void deveRecusarListagemPorUsuarioNaoAutorizado() {
        Usuario usuario = mock(Usuario.class);
        Usuario professor = mock(Usuario.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        when(usuario.getId()).thenReturn(UUID.randomUUID());
        when(professor.getId()).thenReturn(UUID.randomUUID());

        when(atividadeRepository.findById(atividadeId))
                .thenReturn(Optional.of(atividade));

        when(atividade.getTurma()).thenReturn(turma);
        when(turma.getProfessor()).thenReturn(professor);

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.listarPorAtividade(atividadeId, usuario));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    // Avaliação de uma entrega pelo professor responsável
    @Test
    void deveAvaliarEntrega() {
        UUID entregaId = UUID.randomUUID();

        Usuario professor = mock(Usuario.class);
        Usuario professorTurma = mock(Usuario.class);
        Usuario aluno = mock(Usuario.class);

        EntregaIndividual entrega = mock(EntregaIndividual.class);
        EntregaIndividual entregaSalva = mock(EntregaIndividual.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        AvaliacaoInputDTO avaliacao =
                new AvaliacaoInputDTO(new BigDecimal(9.5), "Muito bom");

        ResponseEntregaIndividualDTO dto =
                mock(ResponseEntregaIndividualDTO.class);

        when(professor.getId()).thenReturn(professorId);
        when(professorTurma.getId()).thenReturn(professorId);

        when(entregaRepository.findById(entregaId))
                .thenReturn(Optional.of(entrega));

        when(entrega.getAtividade()).thenReturn(atividade);
        when(atividade.getTurma()).thenReturn(turma);
        when(turma.getProfessor()).thenReturn(professorTurma);

        when(entregaRepository.save(entrega)).thenReturn(entregaSalva);
        when(entregaSalva.getAluno()).thenReturn(aluno);
        when(entregaSalva.getAtividade()).thenReturn(atividade);
        when(atividade.getNome()).thenReturn("Atividade");

        when(atividadeService.mapearEntregaParaDTO(entregaSalva))
                .thenReturn(dto);

        ResponseEntregaIndividualDTO resultado =
                entregaService.avaliar(entregaId, avaliacao, professor);

        assertEquals(dto, resultado);

        verify(entrega).setNota(new BigDecimal(9.5));
        verify(entrega).setComentarioPrivado("Muito bom");
        verify(entregaRepository).save(entrega);
        verify(notificacaoService).notificar(
                eq(aluno),
                any(),
                anyString(),
                eq(turma),
                eq(atividade),
                isNull()
        );
    }

    // Download autorizado para o aluno que realizou a entrega
    @Test
    void devePermitirDownloadParaAlunoDaEntrega() throws IOException {
        UUID entregaId = UUID.randomUUID();

        Usuario usuario = mock(Usuario.class);
        Usuario aluno = mock(Usuario.class);
        Usuario professor = mock(Usuario.class);

        EntregaIndividual entrega = mock(EntregaIndividual.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        Arquivo arquivo = mock(Arquivo.class);

        Path arquivoTemp = Files.createTempFile("entrega", ".pdf");
        byte[] conteudo = "arquivo de teste".getBytes();
        Files.write(arquivoTemp, conteudo);

        try {
            when(usuario.getId()).thenReturn(alunoId);
            when(aluno.getId()).thenReturn(alunoId);
            when(professor.getId()).thenReturn(UUID.randomUUID());

            when(entregaRepository.findById(entregaId))
                    .thenReturn(Optional.of(entrega));

            when(entrega.getAtividade()).thenReturn(atividade);
            when(entrega.getAluno()).thenReturn(aluno);

            when(atividade.getTurma()).thenReturn(turma);
            when(turma.getProfessor()).thenReturn(professor);

            when(arquivoRepository.findByEntregaId(entregaId))
                    .thenReturn(List.of(arquivo));

            when(arquivo.getCaminho()).thenReturn(arquivoTemp.toString());
            when(arquivo.getHashSha256()).thenReturn(null);

            Map.Entry<Arquivo, byte[]> resultado =
                    entregaService.baixarArquivo(entregaId, usuario);

            assertEquals(arquivo, resultado.getKey());
            assertArrayEquals(conteudo, resultado.getValue());

        } finally {
            Files.deleteIfExists(arquivoTemp);
        }
    }

    // Download recusado para usuário que não é aluno nem professor
    @Test
    void deveRecusarDownloadNaoAutorizado() {
        UUID entregaId = UUID.randomUUID();

        Usuario usuario = mock(Usuario.class);
        Usuario aluno = mock(Usuario.class);
        Usuario professor = mock(Usuario.class);

        EntregaIndividual entrega = mock(EntregaIndividual.class);
        Atividade atividade = mock(Atividade.class);
        var turma = mock(com.narniano.rural_sala_de_aula.classes.turma.Turma.class);

        when(usuario.getId()).thenReturn(UUID.randomUUID());
        when(aluno.getId()).thenReturn(UUID.randomUUID());
        when(professor.getId()).thenReturn(UUID.randomUUID());

        when(entregaRepository.findById(entregaId))
                .thenReturn(Optional.of(entrega));

        when(entrega.getAtividade()).thenReturn(atividade);
        when(entrega.getAluno()).thenReturn(aluno);

        when(atividade.getTurma()).thenReturn(turma);
        when(turma.getProfessor()).thenReturn(professor);

        AppException exception = assertThrows(AppException.class,
                () -> entregaService.baixarArquivo(entregaId, usuario));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verifyNoInteractions(arquivoRepository);
    }
}
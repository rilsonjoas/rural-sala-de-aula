package com.narniano.rural_sala_de_aula.classes.turma;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/*
Foram realizados testes unitários das principais
funcionalidades do TurmaService, incluindo:

    cadastro e listagem de turmas
    controle de acesso aos detalhes
    inscrição utilizando código

Também foram testadas situações de erro, como:

    código inválido
    tentativa do professor de se inscrever na própria turma
    inscrição duplicada
 */

@ExtendWith(MockitoExtension.class)
class TurmaServiceTest {

    @Mock private TurmaRepository turmaRepository;
    @Mock private InscricaoRepository inscricaoRepository;
    @Mock private AtividadeRepository atividadeRepository;
    @Mock private EntregaIndividualRepository entregaRepository;
    @Mock private Usuario usuario;

    @InjectMocks private TurmaService turmaService;

    @Test
    void deveCadastrarTurma() {
        Usuario professor = mock(Usuario.class);
        RequestTurmaDTO request = mock(RequestTurmaDTO.class);
        Turma turmaSalva = mock(Turma.class, RETURNS_DEEP_STUBS);

        UUID professorId = UUID.randomUUID();
        UUID turmaId = UUID.randomUUID();

        when(request.nome()).thenReturn("Programação");
        when(request.disciplina()).thenReturn("Programação Web");
        when(request.semestre()).thenReturn("2026.2");
        when(request.diasAula()).thenReturn(List.of(1, 3));
        when(request.descricao()).thenReturn("Turma de programação");

        when(professor.getId()).thenReturn(professorId);
        when(turmaRepository.existsByCodigo(any())).thenReturn(false);
        when(turmaRepository.save(any(Turma.class))).thenReturn(turmaSalva);

        when(turmaSalva.getId()).thenReturn(turmaId);
        when(turmaSalva.getProfessor().getId()).thenReturn(professorId);
        when(turmaSalva.getProfessor().getNome()).thenReturn("Professor");
        when(turmaSalva.getNome()).thenReturn("Programação");
        when(turmaSalva.getDisciplina()).thenReturn("Programação Web");
        when(turmaSalva.getSemestre()).thenReturn("2026.2");
        when(turmaSalva.getDiasAula()).thenReturn(List.of(1, 3));
        when(turmaSalva.getCodigo()).thenReturn("ABC123");

        ResponseTurmaDTO resultado = turmaService.cadastrar(request, professor);

        assertNotNull(resultado);
        verify(turmaRepository).save(any(Turma.class));
    }

    @Test
    void deveListarTurmasSemFiltro() {
        UUID usuarioId = UUID.randomUUID();

        Usuario professor = mock(Usuario.class);
        Turma turma = mock(Turma.class, RETURNS_DEEP_STUBS);

        when(usuario.getId()).thenReturn(usuarioId);
        when(professor.getId()).thenReturn(usuarioId);

        when(turma.getProfessor()).thenReturn(professor);
        when(turmaRepository.findAllByUsuarioId(usuarioId))
                .thenReturn(List.of(turma));

        when(turma.getId()).thenReturn(UUID.randomUUID());
        when(turma.getNome()).thenReturn("POO");
        when(turma.getDisciplina()).thenReturn("Java");
        when(turma.getSemestre()).thenReturn("2026.2");
        when(turma.getDiasAula()).thenReturn(List.of());
        when(turma.getCodigo()).thenReturn("ABC123");

        List<ResponseTurmaDTO> resultado =
                turmaService.listarMinhasTurmas(usuario, null);

        assertEquals(1, resultado.size());
        verify(turmaRepository).findAllByUsuarioId(usuarioId);
    }

    @Test
    void deveFiltrarTurmasPorSemestre() {
        UUID usuarioId = UUID.randomUUID();

        Usuario professor = mock(Usuario.class);
        Turma turma20261 = mock(Turma.class);
        Turma turma20262 = mock(Turma.class);

        when(usuario.getId()).thenReturn(usuarioId);
        when(turma20261.getSemestre()).thenReturn("2026.1");
        when(turma20262.getSemestre()).thenReturn("2026.2");

        when(turmaRepository.findAllByUsuarioId(usuarioId))
                .thenReturn(List.of(turma20261, turma20262));

        when(professor.getId()).thenReturn(usuarioId);
        when(turma20262.getProfessor()).thenReturn(professor);
        when(turma20262.getId()).thenReturn(UUID.randomUUID());
        when(turma20262.getNome()).thenReturn("POO");
        when(turma20262.getDisciplina()).thenReturn("Java");
        when(turma20262.getDiasAula()).thenReturn(List.of(1, 3));
        when(turma20262.getCodigo()).thenReturn("ABC123");

        List<ResponseTurmaDTO> resultado =
                turmaService.listarMinhasTurmas(usuario, "2026.2");

        assertEquals(1, resultado.size());
        assertEquals("2026.2", resultado.get(0).semestre());
    }

    @Test
    void deveObterDetalheComoProfessor() {
        UUID turmaId = UUID.randomUUID();
        UUID professorId = UUID.randomUUID();

        Usuario professor = mock(Usuario.class);
        Turma turma = mock(Turma.class, RETURNS_DEEP_STUBS);

        when(professor.getId()).thenReturn(professorId);
        when(turmaRepository.findById(turmaId)).thenReturn(Optional.of(turma));

        when(turma.getProfessor().getId()).thenReturn(professorId);
        when(turma.getId()).thenReturn(turmaId);
        when(turma.getProfessor().getNome()).thenReturn("Professor");
        when(turma.getNome()).thenReturn("POO");
        when(turma.getDisciplina()).thenReturn("Java");
        when(turma.getSemestre()).thenReturn("2026.2");
        when(turma.getDiasAula()).thenReturn(List.of());
        when(turma.getCodigo()).thenReturn("ABC123");

        ResponseTurmaDTO resultado =
                turmaService.obterDetalhe(turmaId, professor);

        assertNotNull(resultado);
        assertEquals("ABC123", resultado.codigo());
    }

    @Test
    void deveImpedirUsuarioSemAcesso() {
        UUID turmaId = UUID.randomUUID();

        Usuario usuario = mock(Usuario.class);
        Turma turma = mock(Turma.class, RETURNS_DEEP_STUBS);

        when(usuario.getId()).thenReturn(UUID.randomUUID());
        when(turma.getProfessor().getId()).thenReturn(UUID.randomUUID());

        when(turmaRepository.findById(turmaId))
                .thenReturn(Optional.of(turma));

        when(inscricaoRepository.existsByTurmaIdAndAlunoId(
                turmaId, usuario.getId())).thenReturn(false);

        assertThrows(AppException.class,
                () -> turmaService.obterDetalhe(turmaId, usuario));
    }

    @Test
    void deveInscreverAlunoPorCodigo() {
        UUID turmaId = UUID.randomUUID();
        UUID alunoId = UUID.randomUUID();

        Usuario aluno = mock(Usuario.class);
        Usuario professor = mock(Usuario.class);
        Turma turma = mock(Turma.class);

        when(aluno.getId()).thenReturn(alunoId);
        when(professor.getId()).thenReturn(UUID.randomUUID());

        when(turma.getId()).thenReturn(turmaId);
        when(turma.getProfessor()).thenReturn(professor);

        when(turma.getNome()).thenReturn("POO");
        when(turma.getDisciplina()).thenReturn("Java");
        when(turma.getSemestre()).thenReturn("2026.2");
        when(turma.getDiasAula()).thenReturn(List.of());

        when(turmaRepository.findByCodigoIgnoreCase("ABC123"))
                .thenReturn(Optional.of(turma));

        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, alunoId))
                .thenReturn(false);

        ResponseTurmaDTO resultado =
                turmaService.inscreverPorCodigo("ABC123", aluno);

        assertNotNull(resultado);
        verify(inscricaoRepository).save(any());
    }

    @Test
    void deveRejeitarCodigoVazio() {
        assertThrows(AppException.class,
                () -> turmaService.inscreverPorCodigo("", usuario));

        verifyNoInteractions(turmaRepository);
    }

    @Test
    void deveImpedirProfessorDeSeInscreverNaPropriaTurma() {
        UUID professorId = UUID.randomUUID();

        Turma turma = mock(Turma.class, RETURNS_DEEP_STUBS);

        when(usuario.getId()).thenReturn(professorId);
        when(turma.getProfessor().getId()).thenReturn(professorId);

        when(turmaRepository.findByCodigoIgnoreCase("ABC123"))
                .thenReturn(Optional.of(turma));

        assertThrows(AppException.class,
                () -> turmaService.inscreverPorCodigo("ABC123", usuario));

        verifyNoInteractions(inscricaoRepository);
    }

    @Test
    void deveImpedirInscricaoDuplicada() {
        UUID turmaId = UUID.randomUUID();
        UUID alunoId = UUID.randomUUID();

        Usuario aluno = mock(Usuario.class);
        Turma turma = mock(Turma.class, RETURNS_DEEP_STUBS);

        when(aluno.getId()).thenReturn(alunoId);
        when(turma.getId()).thenReturn(turmaId);

        when(turma.getProfessor().getId())
                .thenReturn(UUID.randomUUID());

        when(turmaRepository.findByCodigoIgnoreCase("ABC123"))
                .thenReturn(Optional.of(turma));

        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turmaId, alunoId))
                .thenReturn(true);

        assertThrows(AppException.class,
                () -> turmaService.inscreverPorCodigo("ABC123", aluno));

        verify(inscricaoRepository, never()).save(any());
    }
}
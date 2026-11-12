package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioService;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegrante;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegranteRepository;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoRepository;
import com.narniano.rural_sala_de_aula.classes.grupo.StatusGrupo;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.notificacao.TipoNotificacao;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.classes.usuario.UsuarioRepository;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** RF13: avisos para a turma toda, para grupos ou para alunos específicos (sem banco). */
@ExtendWith(MockitoExtension.class)
class AvisoServiceTest {

    @Mock AvisoRepository avisoRepository;
    @Mock ComentarioService comentarioService;
    @Mock TurmaRepository turmaRepository;
    @Mock InscricaoRepository inscricaoRepository;
    @Mock NotificacaoService notificacaoService;
    @Mock GrupoRepository grupoRepository;
    @Mock GrupoIntegranteRepository integranteRepository;
    @Mock UsuarioRepository usuarioRepository;
    @InjectMocks AvisoService service;

    private Usuario professor;
    private Usuario ana;
    private Usuario bia;
    private Usuario caio;
    private Usuario zeca;
    private Turma turma;
    private Grupo grupo;

    @BeforeEach
    void cenario() {
        professor = usuario("Helena");
        ana = usuario("Ana");
        bia = usuario("Bia");
        caio = usuario("Caio");
        zeca = usuario("Zeca");
        turma = new Turma();
        turma.setId(UUID.randomUUID());
        turma.setNome("Turma A");
        turma.setProfessor(professor);
        grupo = new Grupo();
        grupo.setId(UUID.randomUUID());
        grupo.setTurma(turma);
        grupo.setNome("Time Alfa");
        grupo.setStatus(StatusGrupo.APROVADO);
        lenient().when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
        for (Usuario u : List.of(ana, bia, caio)) {
            lenient().when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), u.getId())).thenReturn(true);
        }
        lenient().when(grupoRepository.findById(grupo.getId())).thenReturn(Optional.of(grupo));
        lenient().when(integranteRepository.findByGrupoIdOrderByEntrouEmAsc(grupo.getId()))
                .thenReturn(List.of(new GrupoIntegrante(grupo, ana), new GrupoIntegrante(grupo, bia)));
        lenient().when(avisoRepository.save(any(Aviso.class))).thenAnswer(i -> {
            Aviso a = i.getArgument(0);
            if (a.getId() == null) a.setId(UUID.randomUUID());
            return a;
        });
        lenient().when(usuarioRepository.findAllById(any())).thenAnswer(i -> {
            java.util.Collection<UUID> ids = i.getArgument(0);
            return List.of(ana, bia, caio).stream().filter(u -> ids.contains(u.getId())).toList();
        });
    }

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    private int status(AppException e) {
        return e.getStatus().value();
    }

    private Aviso avisoDirecionado(Usuario... destinatarios) {
        Aviso a = new Aviso();
        a.setId(UUID.randomUUID());
        a.setTurma(turma);
        a.setAutor(professor);
        a.setTexto("Só para alguns");
        a.setHorario(LocalDateTime.now());
        a.setAlcance(AlcanceAviso.DIRECIONADO);
        a.setDestinatarios(new java.util.HashSet<>(java.util.Arrays.stream(destinatarios).map(Usuario::getId).toList()));
        lenient().when(avisoRepository.findById(a.getId())).thenReturn(Optional.of(a));
        return a;
    }

    @Test
    void sem_destino_o_aviso_vai_para_a_turma_toda() {
        ResponseAvisoDTO dto = service.criarAviso(turma.getId(), new RequestAvisoDTO("Prova na quinta", null, null), professor);

        assertEquals(false, dto.direcionado());
        verify(notificacaoService).notificarAlunosDaTurma(eq(turma), eq(professor), eq(TipoNotificacao.AVISO_NOVO), any(), eq(null), any(Aviso.class));
        verify(notificacaoService, never()).notificar(any(), any(), any(), any(), any(), any());
    }

    @Test
    void aviso_para_um_grupo_e_alunos_avisa_so_essas_pessoas_sem_repetir() {
        when(grupoRepository.findByTurmaId(turma.getId())).thenReturn(List.of(grupo));

        ResponseAvisoDTO dto = service.criarAviso(turma.getId(),
                new RequestAvisoDTO("Reunião do grupo", List.of(grupo.getId()), List.of(bia.getId(), caio.getId())), professor);

        assertTrue(dto.direcionado());
        assertEquals(Set.of(ana.getId(), bia.getId(), caio.getId()),
                dto.destinatarios().stream().map(d -> d.id()).collect(java.util.stream.Collectors.toSet()));
        verify(notificacaoService, times(3)).notificar(any(), eq(TipoNotificacao.AVISO_NOVO), any(), eq(turma), eq(null), any(Aviso.class));
        verify(notificacaoService, never()).notificarAlunosDaTurma(any(), any(), any(), any(), any(), any());
    }

    @Test
    void recusa_com_422_aluno_de_fora_da_turma_e_grupo_de_outra_turma() {
        assertEquals(422, status(assertThrows(AppException.class, () -> service.criarAviso(turma.getId(),
                new RequestAvisoDTO("Oi", null, List.of(zeca.getId())), professor))));

        Turma outra = new Turma();
        outra.setId(UUID.randomUUID());
        Grupo deOutra = new Grupo();
        deOutra.setId(UUID.randomUUID());
        deOutra.setTurma(outra);
        when(grupoRepository.findByTurmaId(turma.getId())).thenReturn(List.of(grupo));
        assertEquals(422, status(assertThrows(AppException.class, () -> service.criarAviso(turma.getId(),
                new RequestAvisoDTO("Oi", List.of(deOutra.getId()), null), professor))));
        verify(avisoRepository, never()).save(any());
    }

    @Test
    void so_o_professor_da_turma_publica() {
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AppException.class, () -> service.criarAviso(turma.getId(),
                new RequestAvisoDTO("Oi", null, null), ana)).getStatus());
    }

    @Test
    void aluno_so_ve_o_aviso_direcionado_se_for_destinatario_e_o_professor_ve_todos_com_os_nomes() {
        Aviso paraTodos = new Aviso();
        paraTodos.setId(UUID.randomUUID());
        paraTodos.setTurma(turma);
        paraTodos.setAutor(professor);
        paraTodos.setTexto("Geral");
        paraTodos.setHorario(LocalDateTime.now().minusHours(1));
        Aviso paraAna = avisoDirecionado(ana);
        when(avisoRepository.findByTurmaIdOrderByHorarioDesc(turma.getId())).thenReturn(List.of(paraAna, paraTodos));
        when(comentarioService.listarDoAviso(any())).thenReturn(List.of());

        List<ResponseAvisoDTO> daAna = service.listarPorTurma(turma.getId(), ana);
        List<ResponseAvisoDTO> doCaio = service.listarPorTurma(turma.getId(), caio);
        List<ResponseAvisoDTO> doProfessor = service.listarPorTurma(turma.getId(), professor);

        assertEquals(2, daAna.size());
        assertEquals(1, doCaio.size());
        assertEquals("Geral", doCaio.get(0).texto());
        assertEquals(2, doProfessor.size());
        assertEquals(null, daAna.get(0).destinatarios()); // o aluno não vê a lista de colegas
        assertEquals(List.of("Ana"), doProfessor.get(0).destinatarios().stream().map(d -> d.nome()).toList());
    }

    @Test
    void aluno_fora_dos_destinatarios_nao_comenta_nem_le_os_comentarios_do_aviso() {
        Aviso paraAna = avisoDirecionado(ana);

        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class,
                () -> service.listarComentarios(paraAna.getId(), caio)).getStatus());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class,
                () -> service.criarComentario(paraAna.getId(), new com.narniano.rural_sala_de_aula.classes.comentario.RequestComentarioDTO("Oi", null), caio)).getStatus());
        verify(comentarioService, never()).criarNoAviso(any(), any(), any());
    }
}

package com.narniano.rural_sala_de_aula.classes.grupo;

import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** RF06, RF07 e RF12: regras de formação de grupos (sem banco). */
@ExtendWith(MockitoExtension.class)
class GrupoServiceTest {

    @Mock GrupoRepository grupoRepository;
    @Mock GrupoIntegranteRepository integranteRepository;
    @Mock ConfiguracaoGruposRepository configuracaoRepository;
    @Mock TurmaRepository turmaRepository;
    @Mock InscricaoRepository inscricaoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @InjectMocks GrupoService service;

    private Usuario professor;
    private Usuario ana;
    private Usuario bia;
    private Usuario caio;
    private Turma turma;

    @BeforeEach
    void cenario() {
        professor = usuario("Helena");
        ana = usuario("Ana");
        bia = usuario("Bia");
        caio = usuario("Caio");
        turma = new Turma();
        turma.setId(UUID.randomUUID());
        turma.setProfessor(professor);
        lenient().when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
        for (Usuario u : List.of(ana, bia, caio)) {
            lenient().when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), u.getId())).thenReturn(true);
        }
        lenient().when(usuarioRepository.findAllById(any())).thenAnswer(i -> {
            java.util.Collection<UUID> pedidos = i.getArgument(0);
            return List.of(ana, bia, caio).stream().filter(u -> pedidos.contains(u.getId())).toList();
        });
        lenient().when(configuracaoRepository.findById(turma.getId())).thenReturn(Optional.empty()); // padrão 2 a 5
        lenient().when(grupoRepository.save(any(Grupo.class))).thenAnswer(i -> {
            Grupo g = i.getArgument(0);
            if (g.getId() == null) g.setId(UUID.randomUUID());
            return g;
        });
        lenient().when(integranteRepository.save(any(GrupoIntegrante.class))).thenAnswer(i -> i.getArgument(0));
    }

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    private Grupo grupo(StatusGrupo status, Usuario criador) {
        Grupo g = new Grupo();
        g.setId(UUID.randomUUID());
        g.setTurma(turma);
        g.setNome("Time");
        g.setStatus(status);
        g.setCriadoPor(criador);
        lenient().when(grupoRepository.findById(g.getId())).thenReturn(Optional.of(g));
        return g;
    }

    private void integrantes(Grupo g, Usuario... membros) {
        List<GrupoIntegrante> lista = new ArrayList<>();
        for (Usuario m : membros) lista.add(new GrupoIntegrante(g, m));
        lenient().when(integranteRepository.findByGrupoIdOrderByEntrouEmAsc(g.getId())).thenReturn(lista);
        lenient().when(integranteRepository.countByGrupoId(g.getId())).thenReturn((long) membros.length);
        for (Usuario m : membros) {
            lenient().when(integranteRepository.findByGrupoIdAndAlunoId(g.getId(), m.getId())).thenReturn(Optional.of(new GrupoIntegrante(g, m)));
        }
    }

    private int status(AppException e) {
        return e.getStatus().value();
    }

    @Test
    void pedido_valido_nasce_pendente_com_quem_pediu_como_primeiro_integrante() {
        GrupoDTO dto = service.solicitar(turma.getId(), new GrupoInputDTO("  Time Alfa ", List.of(bia.getId())), ana);

        assertEquals("Time Alfa", dto.nome());
        assertEquals(StatusGrupo.PENDENTE, dto.status());
        assertEquals(ana.getId(), dto.criadoPorId());
        assertEquals(List.of(ana.getId(), bia.getId()), dto.integrantes().stream().map(IntegranteGrupoDTO::id).toList());
    }

    @Test
    void recusa_com_422_pedido_com_menos_que_o_minimo_ou_mais_que_o_maximo() {
        AppException poucos = assertThrows(AppException.class,
                () -> service.solicitar(turma.getId(), new GrupoInputDTO("Sozinha", List.of()), ana));
        assertEquals(422, status(poucos));

        ConfiguracaoGrupos cfg = new ConfiguracaoGrupos(turma.getId(), 2, 2, null);
        when(configuracaoRepository.findById(turma.getId())).thenReturn(Optional.of(cfg));
        AppException demais = assertThrows(AppException.class,
                () -> service.solicitar(turma.getId(), new GrupoInputDTO("Grande", List.of(bia.getId(), caio.getId())), ana));
        assertEquals(422, status(demais));
        verify(grupoRepository, never()).save(any());
    }

    @Test
    void recusa_com_422_aluno_que_ja_esta_em_grupo_ativo_e_quem_nao_e_da_turma() {
        lenient().when(integranteRepository.existsByGrupoTurmaIdAndAlunoIdAndGrupoStatusNot(turma.getId(), bia.getId(), StatusGrupo.REPROVADO)).thenReturn(true);
        AppException ocupado = assertThrows(AppException.class,
                () -> service.solicitar(turma.getId(), new GrupoInputDTO("Time", List.of(bia.getId())), ana));
        assertEquals(422, status(ocupado));

        Usuario forasteiro = usuario("Zé");
        AppException fora = assertThrows(AppException.class,
                () -> service.solicitar(turma.getId(), new GrupoInputDTO("Time", List.of(forasteiro.getId())), ana));
        assertEquals(422, status(fora));
    }

    @Test
    void recusa_com_422_quando_a_turma_ja_atingiu_o_limite_de_grupos() {
        when(configuracaoRepository.findById(turma.getId())).thenReturn(Optional.of(new ConfiguracaoGrupos(turma.getId(), 2, 5, 1)));
        when(grupoRepository.countByTurmaIdAndStatusNot(turma.getId(), StatusGrupo.REPROVADO)).thenReturn(1L);

        AppException erro = assertThrows(AppException.class,
                () -> service.solicitar(turma.getId(), new GrupoInputDTO("Time", List.of(bia.getId())), ana));
        assertEquals(422, status(erro));
    }

    @Test
    void so_o_professor_da_turma_decide_e_so_uma_vez() {
        Grupo g = grupo(StatusGrupo.PENDENTE, ana);
        integrantes(g, ana, bia);

        assertEquals(403, status(assertThrows(AppException.class, () -> service.decidir(g.getId(), true, ana))));
        assertEquals(StatusGrupo.APROVADO, service.decidir(g.getId(), true, professor).status());
        assertEquals(409, status(assertThrows(AppException.class, () -> service.decidir(g.getId(), false, professor))));
    }

    @Test
    void entrar_exige_grupo_aprovado_com_vaga_e_aluno_sem_outro_grupo() {
        Grupo pendente = grupo(StatusGrupo.PENDENTE, ana);
        integrantes(pendente, ana, bia);
        assertEquals(422, status(assertThrows(AppException.class, () -> service.entrar(pendente.getId(), caio))));

        Grupo cheio = grupo(StatusGrupo.APROVADO, ana);
        when(configuracaoRepository.findById(turma.getId())).thenReturn(Optional.of(new ConfiguracaoGrupos(turma.getId(), 2, 2, null)));
        integrantes(cheio, ana, bia);
        assertEquals(422, status(assertThrows(AppException.class, () -> service.entrar(cheio.getId(), caio))));

        when(configuracaoRepository.findById(turma.getId())).thenReturn(Optional.empty());
        GrupoDTO entrou = service.entrar(cheio.getId(), caio);
        assertEquals(StatusGrupo.APROVADO, entrou.status());
        verify(integranteRepository).save(any(GrupoIntegrante.class));
    }

    @Test
    void sair_de_grupo_aprovado_nao_pode_deixa_lo_abaixo_do_minimo() {
        Grupo g = grupo(StatusGrupo.APROVADO, ana);
        integrantes(g, ana, bia);

        AppException erro = assertThrows(AppException.class, () -> service.sair(g.getId(), bia));
        assertEquals(422, status(erro));
        verify(integranteRepository, never()).delete(any());
    }

    @Test
    void sair_de_grupo_pendente_e_livre_e_o_grupo_vazio_e_descartado() {
        Grupo g = grupo(StatusGrupo.PENDENTE, ana);
        integrantes(g, ana);
        when(integranteRepository.countByGrupoId(g.getId())).thenReturn(0L); // depois da saída

        service.sair(g.getId(), ana);

        verify(integranteRepository).delete(any(GrupoIntegrante.class));
        verify(grupoRepository).delete(g);
    }

    @Test
    void configuracao_padrao_e_2_a_5_e_o_maximo_nao_fica_abaixo_do_minimo() {
        ConfiguracaoGruposDTO padrao = service.obterConfiguracao(turma.getId(), ana);
        assertEquals(new ConfiguracaoGruposDTO(2, 5, null), padrao);

        assertEquals(403, status(assertThrows(AppException.class,
                () -> service.configurar(turma.getId(), new ConfiguracaoGruposDTO(2, 3, null), ana))));
        assertEquals(422, status(assertThrows(AppException.class,
                () -> service.configurar(turma.getId(), new ConfiguracaoGruposDTO(4, 3, null), professor))));
    }
}

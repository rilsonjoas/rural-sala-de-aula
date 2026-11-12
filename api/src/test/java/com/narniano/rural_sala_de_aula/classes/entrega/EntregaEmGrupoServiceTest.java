package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeService;
import com.narniano.rural_sala_de_aula.classes.atividade.TipoAtividade;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo.EntregaEmGrupo;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo.EntregaEmGrupoRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo.EntregasDeGrupo;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegrante;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegranteRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.notificacao.NotificacaoService;
import com.narniano.rural_sala_de_aula.classes.notificacao.TipoNotificacao;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Entrega em nome do grupo (RF06): projetos em grupo (sem banco). */
@ExtendWith(MockitoExtension.class)
class EntregaEmGrupoServiceTest {

    @Mock EntregaIndividualRepository entregaRepository;
    @Mock EntregaEmGrupoRepository entregaEmGrupoRepository;
    @Mock AtividadeRepository atividadeRepository;
    @Mock InscricaoRepository inscricaoRepository;
    @Mock ArquivoRepository arquivoRepository;
    @Mock AtividadeService atividadeService;
    @Mock NotificacaoService notificacaoService;
    @Mock EntregasDeGrupo entregasDeGrupo;
    @Mock GrupoIntegranteRepository integranteRepository;
    @InjectMocks EntregaService service;

    private Usuario professor;
    private Usuario ana;
    private Usuario bia;
    private Usuario forasteiro;
    private Turma turma;
    private Atividade atividade;
    private Grupo grupo;

    @BeforeEach
    void cenario() {
        professor = usuario("Helena");
        ana = usuario("Ana");
        bia = usuario("Bia");
        forasteiro = usuario("Zé");
        turma = new Turma();
        turma.setId(UUID.randomUUID());
        turma.setProfessor(professor);
        atividade = new Atividade();
        atividade.setId(UUID.randomUUID());
        atividade.setNome("Projeto final");
        atividade.setTurma(turma);
        atividade.setTipo(TipoAtividade.PROJETO_EM_GRUPO);
        atividade.setPrazoFinal(LocalDateTime.now().plusDays(3));
        grupo = new Grupo();
        grupo.setId(UUID.randomUUID());
        grupo.setNome("Time Alfa");
        grupo.setTurma(turma);
        lenient().when(atividadeRepository.findById(atividade.getId())).thenReturn(Optional.of(atividade));
        lenient().when(integranteRepository.findByGrupoIdOrderByEntrouEmAsc(grupo.getId()))
                .thenReturn(List.of(new GrupoIntegrante(grupo, ana), new GrupoIntegrante(grupo, bia)));
    }

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    private EntregaEmGrupo entregaDoGrupo() {
        EntregaEmGrupo e = new EntregaEmGrupo();
        e.setId(UUID.randomUUID());
        e.setAtividade(atividade);
        e.setGrupo(grupo);
        e.setEnviadaPor(ana);
        e.setEnviadaEm(LocalDateTime.now());
        return e;
    }

    @Test
    void projeto_em_grupo_exige_grupo_aprovado_para_entregar() {
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), ana.getId())).thenReturn(true);
        when(entregasDeGrupo.grupoAprovadoDoAluno(turma.getId(), ana.getId())).thenReturn(Optional.empty());
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "projeto.pdf", "application/pdf", "conteudo".getBytes());

        AppException erro = assertThrows(AppException.class, () -> service.enviar(atividade.getId(), arquivo, ana));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatus());
        verify(entregaEmGrupoRepository, never()).save(any());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void entrega_ja_avaliada_do_grupo_nao_aceita_novo_envio() {
        when(inscricaoRepository.existsByTurmaIdAndAlunoId(turma.getId(), bia.getId())).thenReturn(true);
        when(entregasDeGrupo.grupoAprovadoDoAluno(turma.getId(), bia.getId())).thenReturn(Optional.of(grupo));
        EntregaEmGrupo avaliada = entregaDoGrupo();
        avaliada.setNota(new BigDecimal("8.0"));
        when(entregaEmGrupoRepository.findByAtividadeIdAndGrupoId(atividade.getId(), grupo.getId())).thenReturn(Optional.of(avaliada));
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "projeto.pdf", "application/pdf", "conteudo".getBytes());

        AppException erro = assertThrows(AppException.class, () -> service.enviar(atividade.getId(), arquivo, bia));

        assertEquals(HttpStatus.CONFLICT, erro.getStatus());
        verify(entregaEmGrupoRepository, never()).save(any());
    }

    @Test
    void avaliar_a_entrega_do_grupo_avisa_todos_os_integrantes_e_so_o_professor_avalia() {
        EntregaEmGrupo entrega = entregaDoGrupo();
        when(entregaRepository.findById(entrega.getId())).thenReturn(Optional.empty());
        when(entregaEmGrupoRepository.findById(entrega.getId())).thenReturn(Optional.of(entrega));
        when(entregaEmGrupoRepository.save(entrega)).thenReturn(entrega);
        AvaliacaoInputDTO nota = new AvaliacaoInputDTO(new BigDecimal("9.5"), "  ótimo  ");

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AppException.class, () -> service.avaliar(entrega.getId(), nota, ana)).getStatus());

        service.avaliar(entrega.getId(), nota, professor);

        assertEquals(new BigDecimal("9.5"), entrega.getNota());
        assertEquals("ótimo", entrega.getComentarioPrivado());
        verify(notificacaoService).notificar(eq(ana), eq(TipoNotificacao.NOTA_PUBLICADA), any(), eq(turma), eq(atividade), eq(null));
        verify(notificacaoService).notificar(eq(bia), eq(TipoNotificacao.NOTA_PUBLICADA), any(), eq(turma), eq(atividade), eq(null));
        verify(notificacaoService, times(2)).notificar(any(), any(), any(), any(), any(), any());
    }

    @Test
    void so_integrante_do_grupo_ou_o_professor_baixam_o_arquivo_da_entrega_em_grupo() {
        EntregaEmGrupo entrega = entregaDoGrupo();
        when(entregaRepository.findById(entrega.getId())).thenReturn(Optional.empty());
        when(entregaEmGrupoRepository.findById(entrega.getId())).thenReturn(Optional.of(entrega));
        when(integranteRepository.findByGrupoIdAndAlunoId(grupo.getId(), forasteiro.getId())).thenReturn(Optional.empty());
        when(integranteRepository.findByGrupoIdAndAlunoId(grupo.getId(), bia.getId()))
                .thenReturn(Optional.of(new GrupoIntegrante(grupo, bia)));
        when(arquivoRepository.findByEntregaId(entrega.getId())).thenReturn(List.of());

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AppException.class, () -> service.baixarArquivo(entrega.getId(), forasteiro)).getStatus());
        // passou da autorização (integrante e professor): sem arquivo anexado, o erro passa a ser 404
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class, () -> service.baixarArquivo(entrega.getId(), bia)).getStatus());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class, () -> service.baixarArquivo(entrega.getId(), professor)).getStatus());
    }

    @Test
    void o_professor_lista_as_entregas_individuais_e_as_dos_grupos_juntas_por_horario() {
        EntregaIndividual individual = new EntregaIndividual();
        individual.setId(UUID.randomUUID());
        individual.setAtividade(atividade);
        individual.setAluno(forasteiro);
        individual.setEnviadaEm(LocalDateTime.now().minusHours(2));
        EntregaEmGrupo doGrupo = entregaDoGrupo();
        doGrupo.setEnviadaEm(LocalDateTime.now().minusHours(5));
        when(entregaRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividade.getId())).thenReturn(List.of(individual));
        when(entregaEmGrupoRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividade.getId())).thenReturn(List.of(doGrupo));
        ResponseEntregaIndividualDTO dtoGrupo = org.mockito.Mockito.mock(ResponseEntregaIndividualDTO.class);
        ResponseEntregaIndividualDTO dtoIndividual = org.mockito.Mockito.mock(ResponseEntregaIndividualDTO.class);
        when(atividadeService.mapearEntregaParaDTO(doGrupo)).thenReturn(dtoGrupo);
        when(atividadeService.mapearEntregaParaDTO(individual)).thenReturn(dtoIndividual);

        List<ResponseEntregaIndividualDTO> lista = service.listarPorAtividade(atividade.getId(), professor);

        assertEquals(List.of(dtoGrupo, dtoIndividual), lista);
    }
}

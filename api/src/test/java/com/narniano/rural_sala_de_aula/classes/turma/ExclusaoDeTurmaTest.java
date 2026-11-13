package com.narniano.rural_sala_de_aula.classes.turma;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Excluir turma: só o professor dela; tudo o que depende da turma sai junto (sem banco). */
@ExtendWith(MockitoExtension.class)
class ExclusaoDeTurmaTest {

    @Mock TurmaRepository turmaRepository;
    @Mock ArquivoRepository arquivoRepository;
    @Mock AtividadeRepository atividadeRepository;
    @InjectMocks TurmaService service;

    private Usuario usuario(String nome) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setNome(nome);
        return u;
    }

    private Turma turma(Usuario professor) {
        Turma t = new Turma();
        t.setId(UUID.randomUUID());
        t.setProfessor(professor);
        when(turmaRepository.findById(t.getId())).thenReturn(Optional.of(t));
        return t;
    }

    @Test
    void o_professor_exclui_a_turma_e_busca_os_arquivos_das_entregas_para_apagar_do_disco() {
        Usuario professor = usuario("Helena");
        Turma t = turma(professor);
        Arquivo a = new Arquivo();
        a.setCaminho("uploads/teste-inexistente.pdf");
        when(arquivoRepository.findByEntregaAtividadeTurmaId(t.getId())).thenReturn(List.of(a));

        service.excluir(t.getId(), professor);

        verify(turmaRepository).delete(t);
        verify(arquivoRepository).findByEntregaAtividadeTurmaId(t.getId());
    }

    @Test
    void as_atividades_saem_antes_da_turma_para_que_as_entregas_dos_grupos_nao_travem_a_exclusao_dos_grupos() {
        Usuario professor = usuario("Helena");
        Turma t = turma(professor);
        List<Atividade> atividades = List.of(new Atividade(), new Atividade());
        when(arquivoRepository.findByEntregaAtividadeTurmaId(t.getId())).thenReturn(List.of());
        when(atividadeRepository.findByTurmaId(t.getId())).thenReturn(atividades);

        service.excluir(t.getId(), professor);

        InOrder ordem = inOrder(atividadeRepository, turmaRepository);
        ordem.verify(atividadeRepository).deleteAll(atividades);
        ordem.verify(atividadeRepository).flush();
        ordem.verify(turmaRepository).delete(t);
    }

    @Test
    void quem_nao_e_o_professor_da_turma_recebe_403_e_nada_e_apagado() {
        Turma t = turma(usuario("Helena"));

        AppException erro = assertThrows(AppException.class, () -> service.excluir(t.getId(), usuario("Ana")));

        assertEquals(HttpStatus.FORBIDDEN, erro.getStatus());
        verify(turmaRepository, never()).delete(t);
    }

    @Test
    void turma_inexistente_devolve_404() {
        UUID id = UUID.randomUUID();
        when(turmaRepository.findById(id)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.NOT_FOUND, assertThrows(AppException.class, () -> service.excluir(id, usuario("Helena"))).getStatus());
    }
}

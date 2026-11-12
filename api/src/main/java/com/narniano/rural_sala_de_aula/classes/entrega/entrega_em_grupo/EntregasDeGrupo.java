package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegrante;
import com.narniano.rural_sala_de_aula.classes.grupo.GrupoIntegranteRepository;
import com.narniano.rural_sala_de_aula.classes.grupo.StatusGrupo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/** Localiza a entrega em nome do grupo de um aluno (projetos em grupo, RF06). */
@Component
@RequiredArgsConstructor
public class EntregasDeGrupo {

    private final GrupoIntegranteRepository integranteRepository;
    private final EntregaEmGrupoRepository entregaEmGrupoRepository;

    /** O grupo aprovado do aluno na turma, se houver. */
    public Optional<Grupo> grupoAprovadoDoAluno(UUID turmaId, UUID alunoId) {
        return integranteRepository.findByGrupoTurmaIdAndAlunoIdAndGrupoStatus(turmaId, alunoId, StatusGrupo.APROVADO)
                .map(GrupoIntegrante::getGrupo);
    }

    /** A entrega que o grupo aprovado do aluno fez nesta atividade. */
    public Optional<EntregaEmGrupo> doAluno(UUID atividadeId, UUID turmaId, UUID alunoId) {
        return grupoAprovadoDoAluno(turmaId, alunoId)
                .flatMap(g -> entregaEmGrupoRepository.findByAtividadeIdAndGrupoId(atividadeId, g.getId()));
    }
}

package com.narniano.rural_sala_de_aula.classes.grupo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrupoIntegranteRepository extends JpaRepository<GrupoIntegrante, UUID> {

    List<GrupoIntegrante> findByGrupoIdOrderByEntrouEmAsc(UUID grupoId);

    List<GrupoIntegrante> findByGrupoTurmaIdOrderByEntrouEmAsc(UUID turmaId);

    Optional<GrupoIntegrante> findByGrupoIdAndAlunoId(UUID grupoId, UUID alunoId);

    long countByGrupoId(UUID grupoId);

    /** O grupo do aluno na turma com o estado informado (usado para achar o grupo APROVADO que entrega em nome dele). */
    Optional<GrupoIntegrante> findByGrupoTurmaIdAndAlunoIdAndGrupoStatus(UUID turmaId, UUID alunoId, StatusGrupo status);

    /** O aluno já está em um grupo da turma que não foi reprovado (pendente ou aprovado)? */
    boolean existsByGrupoTurmaIdAndAlunoIdAndGrupoStatusNot(UUID turmaId, UUID alunoId, StatusGrupo status);
}

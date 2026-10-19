package com.narniano.rural_sala_de_aula.classes.atividade;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AtividadeRepository extends JpaRepository<Atividade, UUID> {
    List<Atividade> findByTurmaId(UUID turmaId);
    List<Atividade> findByTurmaIdIn(List<UUID> turmaIds);

    @Query("SELECT a FROM Atividade a WHERE a.turma.id IN (SELECT i.turma.id FROM Inscricao i WHERE i.aluno.id = :alunoId) AND a.disponivelEm <= CURRENT_TIMESTAMP ORDER BY a.prazoFinal ASC")
    List<Atividade> findDisponiveisParaAluno(@Param("alunoId") UUID alunoId);
}

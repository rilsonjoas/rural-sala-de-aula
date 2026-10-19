package com.narniano.rural_sala_de_aula.classes.turma;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, UUID> {
    Optional<Turma> findByCodigoIgnoreCase(String codigo);
    boolean existsByCodigo(String codigo);
    List<Turma> findByProfessorId(UUID professorId);

    @Query("SELECT t FROM Turma t WHERE t.professor.id = :usuarioId OR t.id IN (SELECT i.turma.id FROM Inscricao i WHERE i.aluno.id = :usuarioId)")
    List<Turma> findAllByUsuarioId(@Param("usuarioId") UUID usuarioId);
}

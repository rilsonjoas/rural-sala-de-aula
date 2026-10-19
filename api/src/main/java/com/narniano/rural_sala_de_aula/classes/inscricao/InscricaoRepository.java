package com.narniano.rural_sala_de_aula.classes.inscricao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InscricaoRepository extends JpaRepository<Inscricao, UUID> {
    boolean existsByTurmaIdAndAlunoId(UUID turmaId, UUID alunoId);
    Optional<Inscricao> findByTurmaIdAndAlunoId(UUID turmaId, UUID alunoId);
    List<Inscricao> findByAlunoId(UUID alunoId);
    List<Inscricao> findByTurmaId(UUID turmaId);
}

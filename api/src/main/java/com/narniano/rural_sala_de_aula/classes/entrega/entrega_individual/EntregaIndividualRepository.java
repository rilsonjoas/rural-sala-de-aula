package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntregaIndividualRepository extends JpaRepository<EntregaIndividual, UUID> {
    Optional<EntregaIndividual> findByAtividadeIdAndAlunoId(UUID atividadeId, UUID alunoId);
    List<EntregaIndividual> findByAtividadeIdOrderByEnviadaEmAsc(UUID atividadeId);
    List<EntregaIndividual> findByAlunoId(UUID alunoId);
    boolean existsByAtividadeIdAndAlunoId(UUID atividadeId, UUID alunoId);
}

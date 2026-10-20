package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Serializa envios do mesmo aluno na mesma atividade ate o fim da transacao (lock consultivo do Postgres).
     * Com heranca JOINED, atividade e aluno ficam em tabelas diferentes e nenhuma UNIQUE do banco cobre o par,
     * entao a unicidade da entrega depende deste lock.
     */
    @Query(value = "select 1 from (select pg_advisory_xact_lock(hashtextextended(:chave, 0))) as t", nativeQuery = true)
    int travarEnvio(@Param("chave") String chave);
}

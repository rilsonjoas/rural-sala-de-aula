package com.narniano.rural_sala_de_aula.classes.grupo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, UUID> {

    List<Grupo> findByTurmaId(UUID turmaId);

    long countByTurmaIdAndStatusNot(UUID turmaId, StatusGrupo status);

    /** Serializa as mudanças de grupos de uma turma até o fim da transação (mesma técnica das entregas). */
    @Query(value = "select 1 from (select pg_advisory_xact_lock(hashtextextended(:chave, 0))) as t", nativeQuery = true)
    int travar(@Param("chave") String chave);
}

package com.narniano.rural_sala_de_aula.classes.grupo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, UUID> {
    List<Grupo> findByTurmaId(UUID turmaId);
}

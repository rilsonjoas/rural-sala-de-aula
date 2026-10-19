package com.narniano.rural_sala_de_aula.classes.aviso;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvisoRepository extends JpaRepository<Aviso, UUID> {
    List<Aviso> findByTurmaIdOrderByHorarioDesc(UUID turmaId);
}

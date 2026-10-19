package com.narniano.rural_sala_de_aula.classes.comentario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, UUID> {
    List<Comentario> findByAvisoIdOrderByHorarioAsc(UUID avisoId);
}

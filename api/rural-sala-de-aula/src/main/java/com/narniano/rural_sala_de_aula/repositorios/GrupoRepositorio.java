package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GrupoRepositorio extends JpaRepository <Grupo, UUID> {
    List<Grupo> findByTurma_Id(UUID id_turma);
}

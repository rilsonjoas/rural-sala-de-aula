package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AvisoRepositorio extends JpaRepository <Aviso, UUID> {
    List<Aviso> findByTurma_Id(UUID id_turma);
}

package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EntregaRepositorio extends JpaRepository <Entrega, UUID> {
    List<Entrega> findByGrupo_Id(UUID id_grupo);
}

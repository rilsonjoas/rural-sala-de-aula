package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.UUID;

public interface TurmaRepositorio extends JpaRepository<Turma, UUID> {
    List<Turma> findByUsuario_Id(UUID id_usuario);
}

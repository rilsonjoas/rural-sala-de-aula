package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtividadeRepositorio extends JpaRepository <Atividade, UUID> {
    List<Atividade> findByTurma_Id(UUID id_turma);
}

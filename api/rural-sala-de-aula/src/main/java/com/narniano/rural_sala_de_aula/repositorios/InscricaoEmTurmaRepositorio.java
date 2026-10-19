package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma.InscricaoEmTurma;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InscricaoEmTurmaRepositorio extends JpaRepository <InscricaoEmTurma, UUID> {
    List<InscricaoEmTurma> findByTurma_Id(UUID id_turma);
    List<InscricaoEmTurma> findByUsuario_Id(UUID id_usuario);
}

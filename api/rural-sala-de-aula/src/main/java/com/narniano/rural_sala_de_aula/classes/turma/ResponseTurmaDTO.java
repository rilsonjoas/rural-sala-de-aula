package com.narniano.rural_sala_de_aula.classes.turma;

import java.util.UUID;

public record ResponseTurmaDTO(
        UUID id,
        UUID idProfessor,
        String nomeProfessor,
        String semestre,
        String codigo,
        String descricao
) {}

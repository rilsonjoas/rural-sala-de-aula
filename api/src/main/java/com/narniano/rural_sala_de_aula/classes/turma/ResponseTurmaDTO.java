package com.narniano.rural_sala_de_aula.classes.turma;

import java.util.List;
import java.util.UUID;

public record ResponseTurmaDTO(
        UUID id,
        UUID professorId,
        String professorNome,
        String nome,
        String disciplina,
        String semestre,
        List<Integer> diasAula,
        String codigo,
        String descricao,
        Integer atividadesPendentes,
        Integer atividadesAtrasadas
) {}

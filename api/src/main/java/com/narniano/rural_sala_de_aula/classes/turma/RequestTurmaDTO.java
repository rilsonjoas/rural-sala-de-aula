package com.narniano.rural_sala_de_aula.classes.turma;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record RequestTurmaDTO(
        @NotBlank(message = "Informe o nome da turma.")
        @Size(max = 120)
        String nome,

        @Size(max = 120)
        String disciplina,

        @NotBlank
        @Pattern(regexp = "^[0-9]{4}\\.[12]$", message = "Semestre deve estar no formato AAAA.1 ou AAAA.2")
        String semestre,

        List<Integer> diasAula,

        @Size(max = 1000)
        String descricao,

        UUID idProfessor,
        String codigo
) {}

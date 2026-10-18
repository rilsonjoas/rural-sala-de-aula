
package com.narniano.rural_sala_de_aula.classes.turma;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RequestTurmaDTO(

        @NotNull
        UUID idProfessor,

        @NotBlank
        @Size(max = 50)
        String semestre,

        @NotBlank
        @Size(max = 50)
        String codigo,

        @Size(max = 1000)
        String descricao

) {}


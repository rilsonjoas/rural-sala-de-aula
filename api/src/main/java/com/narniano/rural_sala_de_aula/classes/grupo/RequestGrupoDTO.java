package com.narniano.rural_sala_de_aula.classes.grupo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RequestGrupoDTO(
        @NotNull UUID idTurma,
        @NotBlank @Size(max = 100) String name
) {}

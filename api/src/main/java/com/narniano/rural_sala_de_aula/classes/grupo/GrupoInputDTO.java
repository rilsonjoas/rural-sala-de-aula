package com.narniano.rural_sala_de_aula.classes.grupo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** integrantesIds são os colegas; quem solicita entra sozinho no grupo. */
public record GrupoInputDTO(
        @NotBlank(message = "Informe o nome do grupo.")
        @Size(max = 80, message = "O nome do grupo tem no máximo 80 caracteres.")
        String nome,

        @NotNull(message = "Informe os integrantes (pode ser uma lista vazia).")
        List<UUID> integrantesIds
) {}

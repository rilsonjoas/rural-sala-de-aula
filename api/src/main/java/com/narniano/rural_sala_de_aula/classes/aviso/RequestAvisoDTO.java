package com.narniano.rural_sala_de_aula.classes.aviso;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** Sem gruposIds nem alunosIds o aviso vai para a turma toda; com um deles, só para essas pessoas. */
public record RequestAvisoDTO(
        @NotBlank(message = "Informe o texto do aviso.")
        @Size(max = 3000, message = "O aviso não pode passar de 3000 caracteres.")
        String texto,

        List<UUID> gruposIds,

        List<UUID> alunosIds
) {}

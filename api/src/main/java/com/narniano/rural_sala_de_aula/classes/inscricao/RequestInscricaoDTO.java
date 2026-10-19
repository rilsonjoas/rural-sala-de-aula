package com.narniano.rural_sala_de_aula.classes.inscricao;

import jakarta.validation.constraints.NotBlank;

public record RequestInscricaoDTO(
        @NotBlank(message = "Informe o código da turma.")
        String codigo
) {}

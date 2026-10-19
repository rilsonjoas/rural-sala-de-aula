package com.narniano.rural_sala_de_aula.classes.arquivo;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RequestArquivoDTO(
        @NotNull UUID idEntrega
) {}

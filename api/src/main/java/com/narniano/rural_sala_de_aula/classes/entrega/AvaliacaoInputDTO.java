package com.narniano.rural_sala_de_aula.classes.entrega;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AvaliacaoInputDTO(
        @NotNull(message = "Informe a nota.")
        @DecimalMin(value = "0.0", message = "A nota deve estar entre 0 e 10.")
        @DecimalMax(value = "10.0", message = "A nota deve estar entre 0 e 10.")
        BigDecimal nota,

        String comentarioPrivado
) {}

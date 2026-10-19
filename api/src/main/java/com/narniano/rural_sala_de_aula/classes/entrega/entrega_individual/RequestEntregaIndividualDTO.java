package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RequestEntregaIndividualDTO(
        @NotNull UUID idUsuario,
        @NotNull UUID idAtividade
) {}

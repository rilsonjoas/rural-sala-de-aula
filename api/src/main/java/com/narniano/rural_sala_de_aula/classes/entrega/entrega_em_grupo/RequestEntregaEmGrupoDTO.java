package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RequestEntregaEmGrupoDTO(
        @NotNull UUID idGrupo,
        @NotNull UUID idAtividade
) {}

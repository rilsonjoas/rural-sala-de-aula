package com.narniano.rural_sala_de_aula.classes.grupo;

import jakarta.validation.constraints.NotNull;

public record DecisaoGrupoDTO(@NotNull(message = "Informe se o grupo foi aprovado.") Boolean aprovado) {}

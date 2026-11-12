package com.narniano.rural_sala_de_aula.classes.usuario;

import jakarta.validation.constraints.NotBlank;

public record RequestExclusaoContaDTO(@NotBlank(message = "Informe a sua senha para confirmar.") String senha) {}

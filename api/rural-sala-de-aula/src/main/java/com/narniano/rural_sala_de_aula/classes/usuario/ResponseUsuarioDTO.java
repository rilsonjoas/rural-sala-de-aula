package com.narniano.rural_sala_de_aula.classes.usuario;

import java.time.LocalDate;
import java.util.UUID;

public record ResponseUsuarioDTO(
        String nome,
        String email,
        LocalDate dataNascimento
) {}

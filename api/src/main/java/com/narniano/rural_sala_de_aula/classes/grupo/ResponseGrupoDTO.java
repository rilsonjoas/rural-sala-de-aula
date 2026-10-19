package com.narniano.rural_sala_de_aula.classes.grupo;

import java.util.UUID;

public record ResponseGrupoDTO(
        UUID id,
        UUID idTurma,
        String codigoTurma,
        String name
) {}

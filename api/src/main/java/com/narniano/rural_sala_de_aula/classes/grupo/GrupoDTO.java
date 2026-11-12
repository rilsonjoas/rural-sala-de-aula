package com.narniano.rural_sala_de_aula.classes.grupo;

import java.util.List;
import java.util.UUID;

public record GrupoDTO(
        UUID id,
        UUID turmaId,
        String nome,
        StatusGrupo status,
        UUID criadoPorId,
        List<IntegranteGrupoDTO> integrantes
) {}

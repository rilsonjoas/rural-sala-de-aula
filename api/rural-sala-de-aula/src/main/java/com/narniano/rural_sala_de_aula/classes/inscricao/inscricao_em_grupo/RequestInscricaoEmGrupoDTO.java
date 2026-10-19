package com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_grupo;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RequestInscricaoEmGrupoDTO(
        @NotNull UUID idUsuario,
        @NotNull UUID idGrupo
) {}

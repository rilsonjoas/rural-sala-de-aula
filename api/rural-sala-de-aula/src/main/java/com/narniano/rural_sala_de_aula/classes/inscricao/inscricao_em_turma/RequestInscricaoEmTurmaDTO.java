package com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RequestInscricaoEmTurmaDTO(
        @NotNull UUID idUsuario,
        @NotNull UUID idTurma
) {}

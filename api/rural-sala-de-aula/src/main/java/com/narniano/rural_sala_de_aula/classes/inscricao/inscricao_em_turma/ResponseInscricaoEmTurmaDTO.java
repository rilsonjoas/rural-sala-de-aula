package com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma;

import java.util.UUID;

public record ResponseInscricaoEmTurmaDTO(
        UUID id,
        UUID idUsuario,
        UUID idTurma,
        String codigoTurma
) {}

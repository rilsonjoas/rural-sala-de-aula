package com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_grupo;

import java.util.UUID;

public record ResponseInscricaoEmGrupoDTO(
        UUID id,
        UUID idUsuario,
        UUID idGrupo,
        String nomeGrupo,
        UUID idTurma
) {}

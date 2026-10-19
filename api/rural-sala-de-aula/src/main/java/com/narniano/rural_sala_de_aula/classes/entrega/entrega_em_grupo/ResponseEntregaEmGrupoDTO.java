package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import java.util.UUID;

public record ResponseEntregaEmGrupoDTO(
        UUID id,
        UUID idGrupo,
        UUID idAtividade,
        String nomeGrupo,
        String nomeAtividade
) {}

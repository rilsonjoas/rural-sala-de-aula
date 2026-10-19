package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import java.util.UUID;

public record ResponseEntregaIndividualDTO(
        UUID id,
        UUID idUsuario,
        String nomeUsuario,
        UUID idAtividade,
        String nomeAtividade
) {}

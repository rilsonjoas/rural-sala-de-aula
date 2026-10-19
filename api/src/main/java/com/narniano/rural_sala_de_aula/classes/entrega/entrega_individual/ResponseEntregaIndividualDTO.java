package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseEntregaIndividualDTO(
        UUID id,
        UUID atividadeId,
        UUID alunoId,
        String alunoNome,
        String nomeOriginal,
        Long tamanhoBytes,
        LocalDateTime enviadaEm,
        boolean atrasada,
        BigDecimal nota,
        String comentarioPrivado
) {}

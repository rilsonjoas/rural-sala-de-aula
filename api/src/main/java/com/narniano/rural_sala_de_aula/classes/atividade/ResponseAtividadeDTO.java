package com.narniano.rural_sala_de_aula.classes.atividade;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseAtividadeDTO(
        UUID id,
        UUID turmaId,
        String turmaNome,
        String nome,
        String descricao,
        TipoAtividade tipo,
        LocalDateTime prazoFinal,
        LocalDateTime disponivelEm,
        boolean aceitaAtraso,
        String estado,
        BigDecimal nota
) {}

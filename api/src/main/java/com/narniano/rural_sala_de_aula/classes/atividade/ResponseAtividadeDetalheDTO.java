package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseAtividadeDetalheDTO(
        UUID id,
        UUID turmaId,
        String turmaNome,
        String professorNome,
        String nome,
        String descricao,
        TipoAtividade tipo,
        LocalDateTime prazoFinal,
        LocalDateTime disponivelEm,
        boolean aceitaAtraso,
        String estado,
        BigDecimal nota,
        ResponseEntregaIndividualDTO minhaEntrega
) {}

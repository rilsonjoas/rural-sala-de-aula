package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.atividade.TipoAtividade;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseAtividadeDTO(
        UUID id,
        UUID idTurma,
        String codigoTurma,
        String nome,
        TipoAtividade tipo_atividade,
        String instrucoes,
        LocalDateTime prazo,
        boolean aceita_atraso
) {}

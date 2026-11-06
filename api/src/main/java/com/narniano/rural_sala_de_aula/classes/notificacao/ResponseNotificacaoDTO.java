package com.narniano.rural_sala_de_aula.classes.notificacao;

import java.time.LocalDateTime;
import java.util.UUID;

/** Nos prazos proximos (tipo PRAZO_PROXIMO) o id e "prazo-<atividadeId>", criadaEm e o prazo final e lida e sempre true. */
public record ResponseNotificacaoDTO(
        String id,
        String tipo,
        String texto,
        UUID turmaId,
        UUID atividadeId,
        UUID avisoId,
        LocalDateTime criadaEm,
        boolean lida,
        boolean paraProfessor
) {}

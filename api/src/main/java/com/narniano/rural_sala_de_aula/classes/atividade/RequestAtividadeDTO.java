package com.narniano.rural_sala_de_aula.classes.atividade;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record RequestAtividadeDTO(
        UUID idTurma,

        @NotBlank
        @Size(max = 200)
        String nome,

        @Size(max = 4000)
        String descricao,

        @NotNull
        TipoAtividade tipo,

        @NotNull
        LocalDateTime prazoFinal,

        LocalDateTime disponivelEm,

        Boolean aceitaAtraso
) {}

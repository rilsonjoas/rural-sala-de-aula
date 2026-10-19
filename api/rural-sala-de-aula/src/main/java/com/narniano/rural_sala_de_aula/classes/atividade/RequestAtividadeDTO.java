package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.atividade.TipoAtividade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record RequestAtividadeDTO(
        @NotNull UUID idTurma,

        @NotBlank
        @Size(max = 100)
        String nome,

        @NotNull
        TipoAtividade tipo_atividade,

        @NotBlank
        String instrucoes,

        @NotNull
        LocalDateTime prazo,

        boolean aceita_atraso
) {}

package com.narniano.rural_sala_de_aula.classes.comentario;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record RequestComentarioDTO(
        @NotNull UUID idAviso,
        UUID idComentario,
        @NotNull UUID idUsuario,
        @NotBlank String texto
) {}

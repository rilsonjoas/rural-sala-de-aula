package com.narniano.rural_sala_de_aula.classes.comentario;

import java.util.UUID;

public record ResponseComentarioDTO(
        UUID id,
        UUID idAviso,
        UUID idComentario,
        UUID idUsuario,
        String nomeUsuario,
        String texto
) {}

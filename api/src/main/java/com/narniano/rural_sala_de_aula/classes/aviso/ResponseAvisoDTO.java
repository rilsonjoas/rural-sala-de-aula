package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.ResponseComentarioDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ResponseAvisoDTO(
        UUID id,
        UUID turmaId,
        UUID autorId,
        String autorNome,
        String texto,
        LocalDateTime horario,
        List<ResponseComentarioDTO> comentarios
) {}

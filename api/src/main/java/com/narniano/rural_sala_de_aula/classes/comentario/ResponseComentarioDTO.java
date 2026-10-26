package com.narniano.rural_sala_de_aula.classes.comentario;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseComentarioDTO(
        UUID id,
        UUID avisoId,
        UUID comentarioPaiId,
        UUID autorId,
        String autorNome,
        String texto,
        LocalDateTime horario
) {}

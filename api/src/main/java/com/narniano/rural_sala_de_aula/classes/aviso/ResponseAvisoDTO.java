package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.ResponseComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.grupo.IntegranteGrupoDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** destinatarios só vai para o professor, e só nos avisos direcionados. */
public record ResponseAvisoDTO(
        UUID id,
        UUID turmaId,
        UUID autorId,
        String autorNome,
        String texto,
        LocalDateTime horario,
        List<ResponseComentarioDTO> comentarios,
        boolean direcionado,
        List<IntegranteGrupoDTO> destinatarios
) {}

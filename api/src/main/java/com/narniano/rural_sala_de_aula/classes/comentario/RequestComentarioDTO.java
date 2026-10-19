package com.narniano.rural_sala_de_aula.classes.comentario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestComentarioDTO(
        @NotBlank(message = "Informe o texto do comentário.")
        @Size(max = 3000, message = "O comentário não pode passar de 3000 caracteres.")
        String texto
) {}

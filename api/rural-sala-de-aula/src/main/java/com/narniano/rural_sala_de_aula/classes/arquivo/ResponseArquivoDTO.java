package com.narniano.rural_sala_de_aula.classes.arquivo;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseArquivoDTO(
        UUID id,
        UUID idEntrega,
        String nomeOriginal,
        String nomeArmazenado,
        String tipoConteudo,
        Long tamanho,
        LocalDateTime dataEnvio
) {}

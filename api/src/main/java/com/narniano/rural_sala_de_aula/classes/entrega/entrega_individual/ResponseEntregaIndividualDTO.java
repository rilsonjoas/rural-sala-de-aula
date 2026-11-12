package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import com.narniano.rural_sala_de_aula.classes.grupo.IntegranteGrupoDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ResponseEntregaIndividualDTO(
        UUID id,
        UUID atividadeId,
        UUID alunoId,
        String alunoNome,
        String nomeOriginal,
        Long tamanhoBytes,
        String hashSha256,
        LocalDateTime enviadaEm,
        boolean atrasada,
        BigDecimal nota,
        String comentarioPrivado,
        UUID grupoId,
        String grupoNome,
        List<IntegranteGrupoDTO> integrantes
) {}

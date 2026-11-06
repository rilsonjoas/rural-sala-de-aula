package com.narniano.rural_sala_de_aula.classes.notificacao;

import java.util.List;

public record ResponseNotificacoesDTO(
        int naoLidas,
        List<ResponseNotificacaoDTO> itens,
        List<ResponseNotificacaoDTO> prazosProximos
) {}

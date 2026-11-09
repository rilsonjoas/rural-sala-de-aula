package com.narniano.rural_sala_de_aula.common.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Atras do Traefik e do nginx o IP real vem em X-Forwarded-For. O Traefik substitui o cabecalho
 * que o cliente manda, entao a primeira entrada e o IP que ele viu; sem proxy vale o endereco da conexao.
 */
public final class IpDoCliente {

    private IpDoCliente() {}

    public static String de(HttpServletRequest request) {
        String encaminhado = request.getHeader("X-Forwarded-For");
        if (encaminhado != null && !encaminhado.isBlank()) {
            return encaminhado.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

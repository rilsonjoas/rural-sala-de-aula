package com.narniano.rural_sala_de_aula.common.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contador de tentativas por chave (IP, e-mail) numa janela fixa, em memoria.
 * Vale para uma instancia da API; ao reiniciar, os contadores zeram.
 */
@Component
public class LimitadorDeTentativas {

    private static final int LIMITE_DE_CHAVES = 10_000;

    private record Janela(Instant inicio, int contagem) {}

    private final ConcurrentHashMap<String, Janela> janelas = new ConcurrentHashMap<>();
    private final Clock relogio;

    public LimitadorDeTentativas() {
        this(Clock.systemUTC());
    }

    LimitadorDeTentativas(Clock relogio) {
        this.relogio = relogio;
    }

    /** Segundos ate liberar a chave, ou 0 se ainda cabem tentativas. */
    public long segundosAteLiberar(String chave, int maximo, Duration janela) {
        Janela atual = janelas.get(chave);
        Instant agora = relogio.instant();
        if (atual == null || !agora.isBefore(atual.inicio().plus(janela)) || atual.contagem() < maximo) {
            return 0;
        }
        return Math.max(1, Duration.between(agora, atual.inicio().plus(janela)).toSeconds());
    }

    public void registrar(String chave, Duration janela) {
        Instant agora = relogio.instant();
        if (janelas.size() > LIMITE_DE_CHAVES) {
            janelas.entrySet().removeIf(e -> !agora.isBefore(e.getValue().inicio().plus(janela)));
        }
        janelas.merge(chave, new Janela(agora, 1), (antiga, nova) ->
                agora.isBefore(antiga.inicio().plus(janela))
                        ? new Janela(antiga.inicio(), antiga.contagem() + 1)
                        : nova);
    }

    public void limpar(String chave) {
        janelas.remove(chave);
    }
}

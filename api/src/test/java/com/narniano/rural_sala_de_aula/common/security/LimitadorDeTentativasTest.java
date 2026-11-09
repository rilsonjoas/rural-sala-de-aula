package com.narniano.rural_sala_de_aula.common.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LimitadorDeTentativasTest {

    private static final Duration JANELA = Duration.ofMinutes(15);

    private static class RelogioAjustavel extends Clock {
        Instant agora = Instant.parse("2026-10-22T12:00:00Z");

        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return agora; }
    }

    @Test
    void liberaAteOMaximoEBloqueiaDepois() {
        var relogio = new RelogioAjustavel();
        var limitador = new LimitadorDeTentativas(relogio);

        for (int i = 0; i < 5; i++) {
            assertEquals(0, limitador.segundosAteLiberar("k", 5, JANELA));
            limitador.registrar("k", JANELA);
        }

        assertTrue(limitador.segundosAteLiberar("k", 5, JANELA) > 0);
        assertEquals(0, limitador.segundosAteLiberar("outra", 5, JANELA));
    }

    @Test
    void informaQuantoFaltaEZeraDepoisDaJanela() {
        var relogio = new RelogioAjustavel();
        var limitador = new LimitadorDeTentativas(relogio);
        for (int i = 0; i < 3; i++) limitador.registrar("k", JANELA);

        relogio.agora = relogio.agora.plus(Duration.ofMinutes(10));
        assertEquals(300, limitador.segundosAteLiberar("k", 3, JANELA));

        relogio.agora = relogio.agora.plus(Duration.ofMinutes(5));
        assertEquals(0, limitador.segundosAteLiberar("k", 3, JANELA));

        limitador.registrar("k", JANELA);
        assertEquals(0, limitador.segundosAteLiberar("k", 3, JANELA));
    }

    @Test
    void limparLiberaAChave() {
        var limitador = new LimitadorDeTentativas(new RelogioAjustavel());
        for (int i = 0; i < 5; i++) limitador.registrar("k", JANELA);
        limitador.limpar("k");
        assertEquals(0, limitador.segundosAteLiberar("k", 5, JANELA));
    }
}

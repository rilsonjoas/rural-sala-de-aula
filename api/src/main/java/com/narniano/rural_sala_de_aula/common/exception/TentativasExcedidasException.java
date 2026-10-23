package com.narniano.rural_sala_de_aula.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class TentativasExcedidasException extends AppException {
    private final long segundosAteLiberar;

    public TentativasExcedidasException(long segundosAteLiberar) {
        super(HttpStatus.TOO_MANY_REQUESTS,
                "Muitas tentativas. Aguarde " + Math.max(1, (segundosAteLiberar + 59) / 60) + " minuto(s) e tente de novo.");
        this.segundosAteLiberar = segundosAteLiberar;
    }
}

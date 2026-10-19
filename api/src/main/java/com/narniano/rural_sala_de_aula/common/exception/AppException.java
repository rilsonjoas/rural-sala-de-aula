package com.narniano.rural_sala_de_aula.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.List;

@Getter
public class AppException extends RuntimeException {
    private final HttpStatus status;
    private final List<ErrorResponseDTO.CampoErroDTO> campos;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.campos = null;
    }

    public AppException(HttpStatus status, String message, List<ErrorResponseDTO.CampoErroDTO> campos) {
        super(message);
        this.status = status;
        this.campos = campos;
    }
}

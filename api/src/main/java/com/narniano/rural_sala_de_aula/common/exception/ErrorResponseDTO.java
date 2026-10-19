package com.narniano.rural_sala_de_aula.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponseDTO {
    private int status;
    private String message;
    private List<CampoErroDTO> campos;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CampoErroDTO {
        private String campo;
        private String mensagem;
    }
}

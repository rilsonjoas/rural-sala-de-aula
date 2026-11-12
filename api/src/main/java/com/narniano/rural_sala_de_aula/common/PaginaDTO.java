package com.narniano.rural_sala_de_aula.common;

import java.util.List;

/** Uma fatia de uma lista e o total de itens (devolvido no cabeçalho X-Total-Count). */
public record PaginaDTO<T>(List<T> itens, long total) {}

package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ArquivoRepositorio extends JpaRepository <Arquivo, UUID> {
}

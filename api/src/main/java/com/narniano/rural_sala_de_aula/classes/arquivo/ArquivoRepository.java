package com.narniano.rural_sala_de_aula.classes.arquivo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArquivoRepository extends JpaRepository<Arquivo, UUID> {
    List<Arquivo> findByEntregaId(UUID entregaId);
}

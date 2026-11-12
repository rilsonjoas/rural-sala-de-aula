package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntregaEmGrupoRepository extends JpaRepository<EntregaEmGrupo, UUID> {

    Optional<EntregaEmGrupo> findByAtividadeIdAndGrupoId(UUID atividadeId, UUID grupoId);

    List<EntregaEmGrupo> findByAtividadeIdOrderByEnviadaEmAsc(UUID atividadeId);
}

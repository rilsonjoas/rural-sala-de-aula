package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_grupo.InscricaoEmGrupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InscricaoEmGrupoRepositorio extends JpaRepository<InscricaoEmGrupo, UUID> {
    List<InscricaoEmGrupo> findByGrupo_Id(UUID id_grupo);
    List<InscricaoEmGrupo> findByUsuario_Id(UUID id_usuario);
    InscricaoEmGrupo findByUsuario_IdAndGrupo_Turma_Id(UUID id_usuario, UUID id_turma);
}

package com.narniano.rural_sala_de_aula.classes.comentario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, UUID> {
    List<Comentario> findByAvisoIdOrderByHorarioAsc(UUID avisoId);

    List<Comentario> findByAtividadeIdOrderByHorarioAsc(UUID atividadeId);

    /** Apaga os comentários do usuário; as respostas a eles saem junto (ON DELETE CASCADE no banco). */
    @Modifying
    @Query("delete from Comentario c where c.usuario.id = :usuarioId")
    void deleteByUsuarioId(@Param("usuarioId") UUID usuarioId);
}

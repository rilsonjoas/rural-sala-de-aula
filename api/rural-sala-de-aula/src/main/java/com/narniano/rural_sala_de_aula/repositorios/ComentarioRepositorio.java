package com.narniano.rural_sala_de_aula.repositorios;

import com.narniano.rural_sala_de_aula.classes.comentario.Comentario;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ComentarioRepositorio extends JpaRepository <Comentario, UUID> {
}

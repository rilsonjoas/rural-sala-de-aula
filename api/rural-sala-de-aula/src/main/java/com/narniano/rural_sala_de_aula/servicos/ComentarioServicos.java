package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.comentario.Comentario;
import com.narniano.rural_sala_de_aula.repositorios.ComentarioRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComentarioServicos {

    private final ComentarioRepositorio comentarioRepositorio;

    public ComentarioServicos(ComentarioRepositorio comentarioRepositorio){
        this.comentarioRepositorio = comentarioRepositorio;
    }

    @Transactional
    public void cadastrar(Comentario comentario){
        comentarioRepositorio.save(comentario);
    }
}

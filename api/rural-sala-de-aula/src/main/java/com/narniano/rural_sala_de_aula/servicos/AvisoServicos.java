package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import com.narniano.rural_sala_de_aula.repositorios.AvisoRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AvisoServicos {

    private final AvisoRepositorio avisoRepositorio;

    public AvisoServicos(AvisoRepositorio avisoRepositorio){
        this.avisoRepositorio = avisoRepositorio;
    }

    @Transactional(readOnly = true)
    public List<Aviso> listarAvisos(UUID id) {
        return avisoRepositorio.findByTurma_Id(id).stream().toList();
    }
}

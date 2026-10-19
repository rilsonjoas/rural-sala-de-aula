package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.repositorios.AtividadeRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AtividadeServicos {

    private final AtividadeRepositorio atividadeRepositorio;

    public AtividadeServicos(AtividadeRepositorio atividadeRepositorio){
        this.atividadeRepositorio = atividadeRepositorio;
    }

    @Transactional(readOnly = true)
    public List<Atividade> listarAtividades(UUID id){
        return atividadeRepositorio.findByTurma_Id(id);
    }
}

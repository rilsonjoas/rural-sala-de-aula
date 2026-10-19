package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_grupo.InscricaoEmGrupo;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.repositorios.EntregaRepositorio;
import com.narniano.rural_sala_de_aula.repositorios.GrupoRepositorio;
import com.narniano.rural_sala_de_aula.repositorios.InscricaoEmGrupoRepositorio;
import com.narniano.rural_sala_de_aula.repositorios.TurmaRepositorio;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GrupoServicos {

    private final GrupoRepositorio grupoRepositorio;
    private final InscricaoEmGrupoRepositorio inscricaoEmGrupoRepositorio;
    private final EntregaRepositorio entregaRepositorio;
    private final TurmaRepositorio turmaRepositorio;

    public GrupoServicos (GrupoRepositorio grupoRepositorio,
                          InscricaoEmGrupoRepositorio inscricaoEmGrupoRepositorio,
                          EntregaRepositorio entregaRepositorio,
                          TurmaRepositorio turmaRepositorio){
        this.grupoRepositorio = grupoRepositorio;
        this.inscricaoEmGrupoRepositorio = inscricaoEmGrupoRepositorio;
        this.entregaRepositorio = entregaRepositorio;
        this.turmaRepositorio = turmaRepositorio;
    }

    @Transactional
    public Grupo cadastrar(Grupo grupo){
        return grupoRepositorio.save(grupo);
    }

    @Transactional(readOnly = true)
    public Grupo buscarPorId(UUID id){
        return grupoRepositorio.findById(id).orElseThrow(() ->
                new EntityNotFoundException(
                        "Grupo não encontrado: " + id
                ));
    }

    @Transactional(readOnly = true)
    public List<Grupo> listarGruposDaTurma(UUID id_turma) {
        return grupoRepositorio.findByTurma_Id(id_turma);
    }

    @Transactional(readOnly = true)
    public Grupo buscarGrupoDoUsuarioNaTurma(UUID id_usuario, UUID id_turma) {
        InscricaoEmGrupo inscricao = inscricaoEmGrupoRepositorio
                .findByUsuario_IdAndGrupo_Turma_Id(id_usuario, id_turma);

        return inscricao.getGrupo();
    }

    @Transactional(readOnly = true)
    public List<Grupo> listarGruposDoUsuario(UUID id_usuario) {
        return inscricaoEmGrupoRepositorio.findByUsuario_Id(id_usuario)
                .stream().map(InscricaoEmGrupo::getGrupo).toList();
    }

    @Transactional
    public Grupo remover(UUID id) {
        return grupoRepositorio.findById(id).orElseThrow(() ->
                new EntityNotFoundException(
                        "Grupo não encontrado: " + id
                ));
    }

}

package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_grupo.InscricaoEmGrupo;
import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma.InscricaoEmTurma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.repositorios.*;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioServicos {

    private final UsuarioRepositorio usuarioRepositorio;
    private final InscricaoEmTurmaRepositorio inscricaoEmTurmaRepositorio;
    private final InscricaoEmGrupoRepositorio inscricaoEmGrupoRepositorio;
    private final ComentarioRepositorio comentarioRepositorio;
    private final EntregaRepositorio entregaRepositorio;
    private final TurmaRepositorio turmaRepositorio;

    private String erro;

    public UsuarioServicos(UsuarioRepositorio usuarioRepositorio,
                           InscricaoEmTurmaRepositorio inscricaoEmTurmaRepositorio,
                           InscricaoEmGrupoRepositorio inscricaoEmGrupoRepositorio,
                           ComentarioRepositorio comentarioRepositorio,
                           EntregaRepositorio entregaRepositorio,
                           TurmaRepositorio turmaRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.inscricaoEmTurmaRepositorio = inscricaoEmTurmaRepositorio;
        this.inscricaoEmGrupoRepositorio = inscricaoEmGrupoRepositorio;
        this.comentarioRepositorio = comentarioRepositorio;
        this.entregaRepositorio = entregaRepositorio;
        this.turmaRepositorio = turmaRepositorio;

        erro = "Usuario não encontrado: ";
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorId(UUID id) {
        return usuarioRepositorio.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                erro + id
                        ));
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarPorTurma(UUID id_turma) {
        return inscricaoEmTurmaRepositorio.findByTurma_Id(id_turma)
                .stream().map(InscricaoEmTurma::getUsuario).toList();
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarPorGrupo(UUID id_grupo) {
        return inscricaoEmGrupoRepositorio.findByGrupo_Id(id_grupo)
                .stream().map(InscricaoEmGrupo::getUsuario).toList();
    }

    @Transactional(readOnly = true)
    public Usuario getProfessor(UUID id_turma) {
        return turmaRepositorio.findById(id_turma).orElseThrow(
                () ->
                        new EntityNotFoundException(
                                "Turma não encontrada: " + id_turma
                        )
        ).getProfessor();
    }

    @Transactional(readOnly = true)
    public Usuario getCriadorDoComentario(UUID id_comentario) {
        return comentarioRepositorio.findById(id_comentario).
                orElseThrow(() ->
                        new EntityNotFoundException(
                                erro + id_comentario
                        )).getUsuario();
    }

    @Transactional(readOnly = true)
    public Usuario getCriadorDaEntrega(UUID id_entrega) {
        Entrega entrega = entregaRepositorio.findById(id_entrega)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Entrega não encontrada: " + id_entrega
                        )
                );

        if(entrega instanceof EntregaIndividual entregaIndividual){
            return entregaIndividual.getUsuario();
        }

        throw new IllegalArgumentException(
                "Esta entrega não é individual."
        );
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {
        return usuarioRepositorio.findAll();
    }

    @Transactional
    public Usuario cadastrar(Usuario usuario) {
        return usuarioRepositorio.save(usuario);
    }

    @Transactional
    public void excluir(UUID id) {
        if (!usuarioRepositorio.existsById(id)) {
            throw new EntityNotFoundException(
                    "Usuário não encontrado: " + id
            );
        }

        usuarioRepositorio.deleteById(id);
    }
}

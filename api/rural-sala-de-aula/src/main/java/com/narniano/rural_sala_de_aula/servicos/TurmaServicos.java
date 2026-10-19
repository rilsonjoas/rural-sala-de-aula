package com.narniano.rural_sala_de_aula.servicos;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma.InscricaoEmTurma;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;

import com.narniano.rural_sala_de_aula.repositorios.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TurmaServicos {

    private final TurmaRepositorio turmaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final InscricaoEmTurmaRepositorio inscricaoEmTurmaRepositorio;


    public TurmaServicos(
            TurmaRepositorio turmaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            InscricaoEmTurmaRepositorio inscricaoEmTurmaRepositorio) {
        this.turmaRepositorio = turmaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.inscricaoEmTurmaRepositorio = inscricaoEmTurmaRepositorio;
    }

    // CREATE
    @Transactional
    public Turma cadastrar(Turma turma) {
        Usuario professor = usuarioRepositorio.findById(turma.getProfessor().getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Professor não encontrado: " + turma.getProfessor().getId()
                ));

        return turma;
    }

    @Transactional(readOnly = true)
    public List<Turma> listarTurmasDoUsuario (UUID id_usuario){
        return turmaRepositorio.findByUsuario_Id(id_usuario);
    }

    @Transactional(readOnly = true)
    public List<Turma> listarTurmasMatriculadas (UUID id_usuario) {
        return inscricaoEmTurmaRepositorio.findByUsuario_Id(id_usuario)
                .stream().map(InscricaoEmTurma::getTurma).toList();
    }

    @Transactional(readOnly = true)
    public Turma buscarPorId(UUID id) {
        return turmaRepositorio.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Turma não encontrada: " + id
                ));
    }

    @Transactional
    public void excluir(UUID id) {
        Turma turma = turmaRepositorio.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Turma não encontrada: " + id
                ));

        turmaRepositorio.delete(turma);
    }
}

package com.narniano.rural_sala_de_aula.controllers;

import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.servicos.UsuarioServicos;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioServicos usuarioServicos;

    public UsuarioController(UsuarioServicos usuarioServicos) {
        this.usuarioServicos = usuarioServicos;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioServicos.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarTodos() {
        return ResponseEntity.ok(usuarioServicos.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Usuario> cadastrar(@RequestBody Usuario usuario) {
        Usuario usuarioSalvo = usuarioServicos.cadastrar(usuario);
        return ResponseEntity.ok(usuarioSalvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        usuarioServicos.excluir(id);
        return ResponseEntity.noContent().build();
    }
}

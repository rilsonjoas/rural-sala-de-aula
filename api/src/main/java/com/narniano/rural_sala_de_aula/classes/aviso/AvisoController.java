package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.comentario.RequestComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.comentario.ResponseComentarioDTO;
import com.narniano.rural_sala_de_aula.classes.usuario.AuthService;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AvisoController {

    private final AvisoService avisoService;
    private final AuthService authService;

    @GetMapping("/api/v1/turmas/{turmaId}/avisos")
    public ResponseEntity<List<ResponseAvisoDTO>> listarAvisos(
            @PathVariable UUID turmaId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseAvisoDTO> avisos = avisoService.listarPorTurma(turmaId, usuario);
        return ResponseEntity.ok(avisos);
    }

    @PostMapping("/api/v1/turmas/{turmaId}/avisos")
    public ResponseEntity<ResponseAvisoDTO> criarAviso(
            @PathVariable UUID turmaId,
            @RequestBody @Valid RequestAvisoDTO dto,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseAvisoDTO aviso = avisoService.criarAviso(turmaId, dto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(aviso);
    }

    @GetMapping("/api/v1/avisos/{avisoId}/comentarios")
    public ResponseEntity<List<ResponseComentarioDTO>> listarComentarios(
            @PathVariable UUID avisoId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseComentarioDTO> comentarios = avisoService.listarComentarios(avisoId, usuario);
        return ResponseEntity.ok(comentarios);
    }

    @PostMapping("/api/v1/avisos/{avisoId}/comentarios")
    public ResponseEntity<ResponseComentarioDTO> criarComentario(
            @PathVariable UUID avisoId,
            @RequestBody @Valid RequestComentarioDTO dto,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseComentarioDTO comentario = avisoService.criarComentario(avisoId, dto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(comentario);
    }
}

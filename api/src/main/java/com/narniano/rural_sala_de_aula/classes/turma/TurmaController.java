package com.narniano.rural_sala_de_aula.classes.turma;

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
@RequestMapping("/api/v1/turmas")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService turmaService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<ResponseTurmaDTO>> listarTurmas(
            @RequestParam(required = false) String semestre,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseTurmaDTO> turmas = turmaService.listarMinhasTurmas(usuario, semestre);
        return ResponseEntity.ok(turmas);
    }

    @PostMapping
    public ResponseEntity<ResponseTurmaDTO> cadastrarTurma(
            @RequestBody @Valid RequestTurmaDTO dto,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseTurmaDTO turma = turmaService.cadastrar(dto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(turma);
    }

    @GetMapping("/{turmaId}")
    public ResponseEntity<ResponseTurmaDTO> obterTurma(
            @PathVariable UUID turmaId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseTurmaDTO turma = turmaService.obterDetalhe(turmaId, usuario);
        return ResponseEntity.ok(turma);
    }
}

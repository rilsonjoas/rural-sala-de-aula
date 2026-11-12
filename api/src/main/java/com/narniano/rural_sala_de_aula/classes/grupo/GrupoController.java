package com.narniano.rural_sala_de_aula.classes.grupo;

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
public class GrupoController {

    private final GrupoService grupoService;
    private final AuthService authService;

    @GetMapping("/api/v1/turmas/{turmaId}/alunos")
    public ResponseEntity<List<IntegranteGrupoDTO>> listarAlunos(@PathVariable UUID turmaId, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.listarAlunos(turmaId, usuario));
    }

    @GetMapping("/api/v1/turmas/{turmaId}/grupos/configuracao")
    public ResponseEntity<ConfiguracaoGruposDTO> obterConfiguracao(@PathVariable UUID turmaId, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.obterConfiguracao(turmaId, usuario));
    }

    @PutMapping("/api/v1/turmas/{turmaId}/grupos/configuracao")
    public ResponseEntity<ConfiguracaoGruposDTO> configurar(
            @PathVariable UUID turmaId, @RequestBody ConfiguracaoGruposDTO dto, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.configurar(turmaId, dto, usuario));
    }

    @GetMapping("/api/v1/turmas/{turmaId}/grupos")
    public ResponseEntity<List<GrupoDTO>> listar(@PathVariable UUID turmaId, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.listar(turmaId, usuario));
    }

    @PostMapping("/api/v1/turmas/{turmaId}/grupos")
    public ResponseEntity<GrupoDTO> solicitar(
            @PathVariable UUID turmaId, @RequestBody @Valid GrupoInputDTO dto, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoService.solicitar(turmaId, dto, usuario));
    }

    @PostMapping("/api/v1/grupos/{grupoId}/aprovacao")
    public ResponseEntity<GrupoDTO> decidir(
            @PathVariable UUID grupoId, @RequestBody @Valid DecisaoGrupoDTO dto, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.decidir(grupoId, dto.aprovado(), usuario));
    }

    @PostMapping("/api/v1/grupos/{grupoId}/integrantes")
    public ResponseEntity<GrupoDTO> entrar(@PathVariable UUID grupoId, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(grupoService.entrar(grupoId, usuario));
    }

    @DeleteMapping("/api/v1/grupos/{grupoId}/integrantes")
    public ResponseEntity<Void> sair(@PathVariable UUID grupoId, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        grupoService.sair(grupoId, usuario);
        return ResponseEntity.noContent().build();
    }
}

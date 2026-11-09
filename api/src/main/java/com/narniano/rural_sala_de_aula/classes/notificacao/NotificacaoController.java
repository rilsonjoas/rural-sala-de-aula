package com.narniano.rural_sala_de_aula.classes.notificacao;

import com.narniano.rural_sala_de_aula.classes.usuario.AuthService;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ResponseNotificacoesDTO> listar(HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        return ResponseEntity.ok(notificacaoService.listar(usuario));
    }

    @PostMapping("/{id}/lida")
    public ResponseEntity<Void> marcarLida(@PathVariable UUID id, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        notificacaoService.marcarLida(id, usuario);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/lidas")
    public ResponseEntity<Void> marcarTodasLidas(HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        notificacaoService.marcarTodasLidas(usuario);
        return ResponseEntity.noContent().build();
    }
}

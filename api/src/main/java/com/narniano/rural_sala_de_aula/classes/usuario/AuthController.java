package com.narniano.rural_sala_de_aula.classes.usuario;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/api/v1/auth/register")
    public ResponseEntity<ResponseUsuarioDTO> register(@RequestBody @Valid RequestUsuarioDTO dto, HttpSession session) {
        ResponseUsuarioDTO response = authService.register(dto, session);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/v1/auth/login")
    public ResponseEntity<ResponseUsuarioDTO> login(@RequestBody @Valid LoginRequestDTO dto, HttpSession session) {
        ResponseUsuarioDTO response = authService.login(dto, session);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/v1/auth/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/me")
    public ResponseEntity<ResponseUsuarioDTO> me(HttpSession session) {
        ResponseUsuarioDTO response = authService.me(session);
        return ResponseEntity.ok(response);
    }
}

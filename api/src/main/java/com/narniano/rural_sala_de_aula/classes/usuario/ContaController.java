package com.narniano.rural_sala_de_aula.classes.usuario;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ContaController {

    private final AuthService authService;
    private final ContaService contaService;

    /** Exclui a própria conta (exige a senha) e encerra a sessão. */
    @PostMapping("/api/v1/me/exclusao")
    public ResponseEntity<Void> excluirConta(@RequestBody @Valid RequestExclusaoContaDTO dto, HttpSession session) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        contaService.excluirConta(usuario, dto.senha());
        authService.logout(session);
        return ResponseEntity.noContent().build();
    }
}

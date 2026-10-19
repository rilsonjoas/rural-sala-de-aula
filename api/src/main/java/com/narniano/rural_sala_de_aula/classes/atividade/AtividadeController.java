package com.narniano.rural_sala_de_aula.classes.atividade;

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
public class AtividadeController {

    private final AtividadeService atividadeService;
    private final AuthService authService;

    @GetMapping("/api/v1/atividades")
    public ResponseEntity<List<ResponseAtividadeDTO>> listarMinhasAtividades(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) TipoAtividade tipo,
            @RequestParam(required = false) UUID turmaId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseAtividadeDTO> atividades = atividadeService.listarMinhasAtividades(usuario, estado, tipo, turmaId);
        return ResponseEntity.ok(atividades);
    }

    @GetMapping("/api/v1/turmas/{turmaId}/atividades")
    public ResponseEntity<List<ResponseAtividadeDTO>> listarPorTurma(
            @PathVariable UUID turmaId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseAtividadeDTO> atividades = atividadeService.listarPorTurma(turmaId, usuario);
        return ResponseEntity.ok(atividades);
    }

    @PostMapping("/api/v1/turmas/{turmaId}/atividades")
    public ResponseEntity<ResponseAtividadeDTO> cadastrar(
            @PathVariable UUID turmaId,
            @RequestBody @Valid RequestAtividadeDTO dto,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseAtividadeDTO atividade = atividadeService.cadastrar(turmaId, dto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(atividade);
    }

    @GetMapping("/api/v1/atividades/{atividadeId}")
    public ResponseEntity<ResponseAtividadeDetalheDTO> obterDetalhe(
            @PathVariable UUID atividadeId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseAtividadeDetalheDTO detalhe = atividadeService.obterDetalhe(atividadeId, usuario);
        return ResponseEntity.ok(detalhe);
    }
}

package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.usuario.AuthService;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EntregaController {

    private final EntregaService entregaService;
    private final AuthService authService;

    @PostMapping(value = "/api/v1/atividades/{atividadeId}/entregas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseEntregaIndividualDTO> enviar(
            @PathVariable UUID atividadeId,
            @RequestParam("arquivo") MultipartFile arquivo,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseEntregaIndividualDTO entrega = entregaService.enviar(atividadeId, arquivo, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(entrega);
    }

    @GetMapping("/api/v1/atividades/{atividadeId}/entregas")
    public ResponseEntity<List<ResponseEntregaIndividualDTO>> listarPorAtividade(
            @PathVariable UUID atividadeId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        List<ResponseEntregaIndividualDTO> entregas = entregaService.listarPorAtividade(atividadeId, usuario);
        return ResponseEntity.ok(entregas);
    }

    @PutMapping("/api/v1/entregas/{entregaId}/avaliacao")
    public ResponseEntity<ResponseEntregaIndividualDTO> avaliar(
            @PathVariable UUID entregaId,
            @RequestBody @Valid AvaliacaoInputDTO dto,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        ResponseEntregaIndividualDTO avaliada = entregaService.avaliar(entregaId, dto, usuario);
        return ResponseEntity.ok(avaliada);
    }

    @GetMapping("/api/v1/entregas/{entregaId}/arquivo")
    public ResponseEntity<byte[]> baixarArquivo(
            @PathVariable UUID entregaId,
            HttpSession session
    ) {
        Usuario usuario = authService.getUsuarioAutenticado(session);
        Map.Entry<Arquivo, byte[]> resultado = entregaService.baixarArquivo(entregaId, usuario);
        Arquivo arquivo = resultado.getKey();
        byte[] bytes = resultado.getValue();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + arquivo.getNomeOriginal() + "\"")
                .contentType(MediaType.parseMediaType(arquivo.getTipoConteudo()))
                .contentLength(bytes.length)
                .body(bytes);
    }
}

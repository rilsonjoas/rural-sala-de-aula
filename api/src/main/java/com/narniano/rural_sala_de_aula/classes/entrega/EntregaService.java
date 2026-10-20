package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeService;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.ResponseEntregaIndividualDTO;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private static final long LIMITE_TAMANHO_BYTES = 25 * 1024 * 1024; // 25 MB
    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of(
            "pdf", "doc", "docx", "txt", "zip", "ppt", "pptx", "odt", "odp", "png", "jpg", "jpeg"
    );

    private final EntregaIndividualRepository entregaRepository;
    private final AtividadeRepository atividadeRepository;
    private final InscricaoRepository inscricaoRepository;
    private final ArquivoRepository arquivoRepository;
    private final AtividadeService atividadeService;

    @Transactional
    public ResponseEntregaIndividualDTO enviar(UUID atividadeId, MultipartFile file, Usuario aluno) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Arquivo não enviado.");
        }

        if (file.getSize() > LIMITE_TAMANHO_BYTES) {
            throw new AppException(HttpStatus.PAYLOAD_TOO_LARGE, "O arquivo passa de 25 MB. Envie um arquivo menor.");
        }

        String nomeOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "entrega";
        String extensao = obterExtensao(nomeOriginal).toLowerCase();
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new AppException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.");
        }

        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        if (!inscricaoRepository.existsByTurmaIdAndAlunoId(atividade.getTurma().getId(), aluno.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Você não está matriculado nesta turma.");
        }

        LocalDateTime agora = LocalDateTime.now();
        boolean atrasada = agora.isAfter(atividade.getPrazoFinal());
        if (atrasada && !atividade.isAceitaAtraso()) {
            throw new AppException(HttpStatus.FORBIDDEN, "O prazo encerrou e esta atividade não aceita entregas com atraso.");
        }

        entregaRepository.travarEnvio(atividadeId + ":" + aluno.getId());
        Optional<EntregaIndividual> existenteOpt = entregaRepository.findByAtividadeIdAndAlunoId(atividadeId, aluno.getId());
        EntregaIndividual entrega;

        if (existenteOpt.isPresent()) {
            entrega = existenteOpt.get();
            if (entrega.getNota() != null) {
                throw new AppException(HttpStatus.CONFLICT, "Esta entrega já foi avaliada e não aceita novo envio.");
            }
            entrega.setEnviadaEm(agora);
        } else {
            entrega = new EntregaIndividual();
            entrega.setAtividade(atividade);
            entrega.setAluno(aluno);
            entrega.setEnviadaEm(agora);
        }

        EntregaIndividual salva = entregaRepository.save(entrega);

        String nomeArmazenado = salva.getId() + "_" + UUID.randomUUID() + "." + extensao;
        String caminhoRelativo = salvarArquivoNoDisco(file, nomeArmazenado);

        Arquivo arquivo = new Arquivo();
        arquivo.setEntrega(salva);
        arquivo.setNomeOriginal(nomeOriginal);
        arquivo.setNomeArmazenado(nomeArmazenado);
        arquivo.setCaminho(caminhoRelativo);
        arquivo.setTipoConteudo(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        arquivo.setTamanho(file.getSize());
        arquivo.setDataEnvio(agora);

        arquivoRepository.save(arquivo);
        salva.getArquivos().clear();
        salva.getArquivos().add(arquivo);

        return atividadeService.mapearEntregaParaDTO(salva);
    }

    @Transactional(readOnly = true)
    public List<ResponseEntregaIndividualDTO> listarPorAtividade(UUID atividadeId, Usuario professor) {
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        if (!atividade.getTurma().getProfessor().getId().equals(professor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Acesso restrito ao professor da turma.");
        }

        return entregaRepository.findByAtividadeIdOrderByEnviadaEmAsc(atividadeId).stream()
                .map(atividadeService::mapearEntregaParaDTO)
                .toList();
    }

    @Transactional
    public ResponseEntregaIndividualDTO avaliar(UUID entregaId, AvaliacaoInputDTO dto, Usuario professor) {
        EntregaIndividual entrega = entregaRepository.findById(entregaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Entrega não encontrada."));

        if (!entrega.getAtividade().getTurma().getProfessor().getId().equals(professor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Acesso restrito ao professor da turma.");
        }

        entrega.setNota(dto.nota());
        entrega.setComentarioPrivado(dto.comentarioPrivado() != null ? dto.comentarioPrivado().trim() : null);

        EntregaIndividual salva = entregaRepository.save(entrega);
        return atividadeService.mapearEntregaParaDTO(salva);
    }

    @Transactional(readOnly = true)
    public Map.Entry<Arquivo, byte[]> baixarArquivo(UUID entregaId, Usuario usuario) {
        EntregaIndividual entrega = entregaRepository.findById(entregaId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Entrega não encontrada."));

        boolean isProfessor = entrega.getAtividade().getTurma().getProfessor().getId().equals(usuario.getId());
        boolean isAluno = entrega.getAluno().getId().equals(usuario.getId());

        if (!isProfessor && !isAluno) {
            throw new AppException(HttpStatus.FORBIDDEN, "Acesso não autorizado ao arquivo desta entrega.");
        }

        List<Arquivo> arquivos = arquivoRepository.findByEntregaId(entregaId);
        if (arquivos.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "Nenhum arquivo anexado a esta entrega.");
        }

        Arquivo arquivo = arquivos.get(0);
        byte[] conteudo = lerArquivoDoDisco(arquivo.getCaminho());

        return Map.entry(arquivo, conteudo);
    }

    private String salvarArquivoNoDisco(MultipartFile file, String nomeArmazenado) {
        try {
            Path pastaUploads = Paths.get("uploads");
            if (!Files.exists(pastaUploads)) {
                Files.createDirectories(pastaUploads);
            }
            Path destino = pastaUploads.resolve(nomeArmazenado);
            // caminho absoluto: com caminho relativo o Tomcat grava no diretorio temporario dele
            file.transferTo(destino.toAbsolutePath());
            return destino.toString();
        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao gravar arquivo em disco: " + e.getMessage());
        }
    }

    private byte[] lerArquivoDoDisco(String caminho) {
        try {
            Path path = Paths.get(caminho);
            if (!Files.exists(path)) {
                return new byte[0];
            }
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao ler arquivo: " + e.getMessage());
        }
    }

    private String obterExtensao(String nome) {
        int idx = nome.lastIndexOf('.');
        return idx > 0 ? nome.substring(idx + 1) : "";
    }
}

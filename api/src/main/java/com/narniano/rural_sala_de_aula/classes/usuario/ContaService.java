package com.narniano.rural_sala_de_aula.classes.usuario;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.arquivo.ArquivoRepository;
import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioRepository;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividual;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.security.PasswordEncoderUtil;
import com.narniano.rural_sala_de_aula.common.storage.ArquivosNoDisco;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/** Exclusão da própria conta. */
@Service
@RequiredArgsConstructor
public class ContaService {

    private final UsuarioRepository usuarioRepository;
    private final TurmaRepository turmaRepository;
    private final EntregaIndividualRepository entregaRepository;
    private final ArquivoRepository arquivoRepository;
    private final ComentarioRepository comentarioRepository;

    /**
     * Exige a senha. Quem leciona turmas precisa excluí-las antes (409): apagar a conta não pode levar as turmas dos alunos.
     * Saem junto as inscrições, os grupos, as notificações, as entregas individuais (com os arquivos) e os comentários.
     */
    @Transactional
    public void excluirConta(Usuario usuario, String senha) {
        if (senha == null || !PasswordEncoderUtil.matches(senha, usuario.getSenha())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Senha incorreta. A conta não foi excluída.");
        }
        int lecionadas = turmaRepository.findByProfessorId(usuario.getId()).size();
        if (lecionadas > 0) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Você leciona " + lecionadas + (lecionadas == 1 ? " turma" : " turmas") + ". Exclua " + (lecionadas == 1 ? "a turma" : "as turmas") + " antes de excluir a conta.");
        }

        List<EntregaIndividual> entregas = entregaRepository.findByAlunoId(usuario.getId());
        List<String> caminhos = new ArrayList<>();
        for (EntregaIndividual e : entregas) {
            arquivoRepository.findByEntregaId(e.getId()).stream().map(Arquivo::getCaminho).forEach(caminhos::add);
        }
        entregaRepository.deleteAll(entregas);
        comentarioRepository.deleteByUsuarioId(usuario.getId());
        usuarioRepository.delete(usuario);
        ArquivosNoDisco.apagarAposCommit(caminhos);
    }
}

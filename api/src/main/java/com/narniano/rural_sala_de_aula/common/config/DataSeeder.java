package com.narniano.rural_sala_de_aula.common.config;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.atividade.TipoAtividade;
import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import com.narniano.rural_sala_de_aula.classes.aviso.AvisoRepository;
import com.narniano.rural_sala_de_aula.classes.comentario.Comentario;
import com.narniano.rural_sala_de_aula.classes.comentario.ComentarioRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.Inscricao;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.classes.usuario.UsuarioRepository;
import com.narniano.rural_sala_de_aula.common.security.PasswordEncoderUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final TurmaRepository turmaRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AtividadeRepository atividadeRepository;
    private final AvisoRepository avisoRepository;
    private final ComentarioRepository comentarioRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        // 1. Criar Usuários
        Usuario professor = new Usuario();
        professor.setNome("Paulo Silva");
        professor.setEmail("paulo@ufrpe.br");
        professor.setSenha(PasswordEncoderUtil.encode("senha1234"));
        professor.setDataNascimento(LocalDate.of(1985, 3, 15));
        professor = usuarioRepository.save(professor);

        Usuario aluna = new Usuario();
        aluna.setNome("Maria Clara Albuquerque");
        aluna.setEmail("maria@ufrpe.br");
        aluna.setSenha(PasswordEncoderUtil.encode("senha1234"));
        aluna.setDataNascimento(LocalDate.of(2003, 8, 20));
        aluna = usuarioRepository.save(aluna);

        Usuario aluno2 = new Usuario();
        aluno2.setNome("Lucas Mendes");
        aluno2.setEmail("lucas@ufrpe.br");
        aluno2.setSenha(PasswordEncoderUtil.encode("senha1234"));
        aluno2.setDataNascimento(LocalDate.of(2002, 11, 5));
        aluno2 = usuarioRepository.save(aluno2);

        Usuario professora = new Usuario();
        professora.setNome("Carla Mendes");
        professora.setEmail("carla@ufrpe.br");
        professora.setSenha(PasswordEncoderUtil.encode("senha1234"));
        professora.setDataNascimento(LocalDate.of(1988, 7, 22));
        professora = usuarioRepository.save(professora);

        // 2. Criar Turmas
        Turma turmaA = new Turma();
        turmaA.setProfessor(professor);
        turmaA.setNome("Turma A — Algoritmos");
        turmaA.setDisciplina("Algoritmos e Estruturas de Dados II");
        turmaA.setSemestre("2026.2");
        turmaA.setDiasAula(List.of(1, 3)); // Seg, Qua
        turmaA.setCodigo("ALG202");
        turmaA.setDescricao("Aulas no Lab 3 do Departamento de Computação.");
        turmaA = turmaRepository.save(turmaA);

        Turma turmaB = new Turma();
        turmaB.setProfessor(professora);
        turmaB.setNome("Turma B — Programação Web");
        turmaB.setDisciplina("Desenvolvimento de Aplicações Web");
        turmaB.setSemestre("2026.2");
        turmaB.setDiasAula(List.of(2, 4)); // Ter, Qui
        turmaB.setCodigo("WEB404");
        turmaB.setDescricao("Sala Virtual do Google Meet para dúvidas às sextas.");
        turmaB = turmaRepository.save(turmaB);

        Turma turmaC = new Turma();
        turmaC.setProfessor(professor);
        turmaC.setNome("Turma C — Banco de Dados");
        turmaC.setDisciplina("Sistemas de Banco de Dados I");
        turmaC.setSemestre("2026.1");
        turmaC.setDiasAula(List.of(2, 5)); // Ter, Sex
        turmaC.setCodigo("BD2026");
        turmaC.setDescricao("Semestre anterior concluído.");
        turmaC = turmaRepository.save(turmaC);

        Turma turmaD = new Turma();
        turmaD.setProfessor(professora);
        turmaD.setNome("Turma D — Inteligência Artificial");
        turmaD.setDisciplina("Inteligência Artificial Aplicada");
        turmaD.setSemestre("2026.2");
        turmaD.setDiasAula(List.of(1, 3)); // Seg, Qua
        turmaD.setCodigo("IAA505");
        turmaD.setDescricao("Fundamentos de ML, redes neurais e visão computacional.");
        turmaD = turmaRepository.save(turmaD);

        Turma turmaE = new Turma();
        turmaE.setProfessor(professora);
        turmaE.setNome("Turma E — Metodologia Científica");
        turmaE.setDisciplina("Metodologia da Pesquisa Científica");
        turmaE.setSemestre("2026.1");
        turmaE.setDiasAula(List.of(5)); // Sex
        turmaE.setCodigo("MET101");
        turmaE.setDescricao("Estrutura de artigos, métodos de pesquisa e escrita acadêmica.");
        turmaE = turmaRepository.save(turmaE);

        // 3. Inscrições
        inscricaoRepository.save(new Inscricao(turmaA, aluna));
        inscricaoRepository.save(new Inscricao(turmaB, aluna));
        inscricaoRepository.save(new Inscricao(turmaC, aluna));
        inscricaoRepository.save(new Inscricao(turmaA, aluno2));
        inscricaoRepository.save(new Inscricao(turmaD, aluna));

        // Inscrições do Paulo como Aluno:
        inscricaoRepository.save(new Inscricao(turmaB, professor));
        inscricaoRepository.save(new Inscricao(turmaD, professor));
        inscricaoRepository.save(new Inscricao(turmaE, professor));

        // 4. Atividades
        Atividade atv1 = new Atividade();
        atv1.setTurma(turmaA);
        atv1.setNome("Lista 1 — Recursão e Divisão e Conquista");
        atv1.setDescricao("Implementar soluções recursivas para os problemas do roteiro em Java.");
        atv1.setTipo(TipoAtividade.LISTA_DE_EXERCICIO);
        atv1.setDisponivelEm(LocalDateTime.now().minusDays(3));
        atv1.setPrazoFinal(LocalDateTime.now().plusDays(2));
        atv1.setAceitaAtraso(true);
        atividadeRepository.save(atv1);

        Atividade atv2 = new Atividade();
        atv2.setTurma(turmaA);
        atv2.setNome("Prova Teórica 1");
        atv2.setDescricao("Avaliação individual sobre complexidade assintótica e algoritmos de ordenação.");
        atv2.setTipo(TipoAtividade.PROVA);
        atv2.setDisponivelEm(LocalDateTime.now().minusDays(10));
        atv2.setPrazoFinal(LocalDateTime.now().minusDays(5));
        atv2.setAceitaAtraso(false);
        atividadeRepository.save(atv2);

        // Atividades das turmas onde Paulo é Aluno:
        Atividade atvB1 = new Atividade();
        atvB1.setTurma(turmaB);
        atvB1.setNome("Prática 2 — Layout Flexbox e CSS Grid");
        atvB1.setDescricao("Desenvolver interface responsiva de dashboard acadêmico utilizando Flexbox e CSS Grid.");
        atvB1.setTipo(TipoAtividade.LISTA_DE_EXERCICIO);
        atvB1.setDisponivelEm(LocalDateTime.now().minusDays(4));
        atvB1.setPrazoFinal(LocalDateTime.now().plusDays(1)); // Vence em breve!
        atvB1.setAceitaAtraso(true);
        atividadeRepository.save(atvB1);

        Atividade atvB2 = new Atividade();
        atvB2.setTurma(turmaB);
        atvB2.setNome("Seminário — APIs REST e GraphQL");
        atvB2.setDescricao("Apresentação de seminário comparando arquiteturas REST e GraphQL para microsserviços.");
        atvB2.setTipo(TipoAtividade.PROJETO_EM_GRUPO);
        atvB2.setDisponivelEm(LocalDateTime.now().minusDays(2));
        atvB2.setPrazoFinal(LocalDateTime.now().plusDays(15));
        atvB2.setAceitaAtraso(true);
        atividadeRepository.save(atvB2);

        Atividade atvD1 = new Atividade();
        atvD1.setTurma(turmaD);
        atvD1.setNome("Hands-on 1 — Análise Exploratória com Pandas");
        atvD1.setDescricao("Limpeza, tratamento de valores faltantes e análise exploratória do dataset do SUS.");
        atvD1.setTipo(TipoAtividade.LISTA_DE_EXERCICIO);
        atvD1.setDisponivelEm(LocalDateTime.now().minusDays(3));
        atvD1.setPrazoFinal(LocalDateTime.now().plusDays(4));
        atvD1.setAceitaAtraso(true);
        atividadeRepository.save(atvD1);

        Atividade atvD2 = new Atividade();
        atvD2.setTurma(turmaD);
        atvD2.setNome("Prova Teórica 1 — Conceitos de Aprendizado Supervisionado");
        atvD2.setDescricao("Avaliação individual sobre modelos de regressão, árvores de decisão e métricas de avaliação.");
        atvD2.setTipo(TipoAtividade.PROVA);
        atvD2.setDisponivelEm(LocalDateTime.now().minusDays(25));
        atvD2.setPrazoFinal(LocalDateTime.now().minusDays(14));
        atvD2.setAceitaAtraso(false);
        atividadeRepository.save(atvD2);

        // 5. Mural de Avisos
        Aviso aviso = new Aviso();
        aviso.setTurma(turmaA);
        aviso.setAutor(professor);
        aviso.setTexto("Sejam bem-vindos ao semestre 2026.2! O material da Lista 1 já se encontra disponível. Qualquer dúvida comentem aqui ou mandem mensagem.");
        aviso.setHorario(LocalDateTime.now().minusDays(2));
        aviso = avisoRepository.save(aviso);

        Comentario comentario = new Comentario();
        comentario.setAviso(aviso);
        comentario.setUsuario(aluna);
        comentario.setTexto("Professor, a entrega pode ser em arquivo compactado .zip?");
        comentario.setHorario(LocalDateTime.now().minusDays(1));
        comentarioRepository.save(comentario);
    }
}

package com.narniano.rural_sala_de_aula.classes.notificacao;

import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import com.narniano.rural_sala_de_aula.classes.atividade.AtividadeRepository;
import com.narniano.rural_sala_de_aula.classes.aviso.Aviso;
import com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual.EntregaIndividualRepository;
import com.narniano.rural_sala_de_aula.classes.inscricao.Inscricao;
import com.narniano.rural_sala_de_aula.classes.inscricao.InscricaoRepository;
import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacaoService {

    static final int LIMITE_DE_ITENS = 50;
    static final int TAMANHO_MAXIMO_DO_TEXTO = 300;
    static final Duration JANELA_PRAZO_PROXIMO = Duration.ofHours(48);
    static final Duration JANELA_ATIVIDADE_NOVA = Duration.ofDays(14);

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM");

    private final NotificacaoRepository notificacaoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final TurmaRepository turmaRepository;
    private final AtividadeRepository atividadeRepository;
    private final EntregaIndividualRepository entregaRepository;
    private final JdbcTemplate jdbcTemplate;

    // "atividade nova" so vale para atividades abertas depois que a V5 foi aplicada
    private LocalDateTime inicioDasNotificacoes = LocalDateTime.now();

    @PostConstruct
    void carregarInicioDasNotificacoes() {
        try {
            Timestamp aplicada = jdbcTemplate.queryForObject(
                    "SELECT installed_on FROM flyway_schema_history WHERE version = '5'", Timestamp.class);
            if (aplicada != null) {
                inicioDasNotificacoes = aplicada.toLocalDateTime();
            }
            log.info("Notificacoes: 'atividade nova' vale para atividades abertas a partir de {} (V5 aplicada)", inicioDasNotificacoes);
        } catch (DataAccessException e) {
            inicioDasNotificacoes = LocalDateTime.now();
            log.warn("Notificacoes: nao consegui ler a data da V5 no historico do Flyway; usando o horario de inicio ({})", inicioDasNotificacoes, e);
        }
    }

    @Transactional
    public void notificar(Usuario destinatario, TipoNotificacao tipo, String texto, Turma turma, Atividade atividade, Aviso aviso) {
        Notificacao n = new Notificacao();
        n.setUsuario(destinatario);
        n.setTipo(tipo);
        n.setTexto(cortar(texto));
        n.setTurmaId(turma.getId());
        n.setAtividadeId(atividade != null ? atividade.getId() : null);
        n.setAvisoId(aviso != null ? aviso.getId() : null);
        n.setCriadaEm(LocalDateTime.now());
        notificacaoRepository.save(n);
    }

    @Transactional
    public void notificarAlunosDaTurma(Turma turma, Usuario autor, TipoNotificacao tipo, String texto, Atividade atividade, Aviso aviso) {
        for (Inscricao inscricao : inscricaoRepository.findByTurmaId(turma.getId())) {
            Usuario aluno = inscricao.getAluno();
            if (!aluno.getId().equals(autor.getId())) {
                notificar(aluno, tipo, texto, turma, atividade, aviso);
            }
        }
    }

    @Transactional
    public ResponseNotificacoesDTO listar(Usuario usuario) {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime desde = agora.minus(JANELA_ATIVIDADE_NOVA);
        if (inicioDasNotificacoes.isAfter(desde)) {
            desde = inicioDasNotificacoes;
        }
        notificacaoRepository.criarAtividadesNovas(usuario.getId(), agora, desde);

        Set<UUID> turmasDoProfessor = turmaRepository.findByProfessorId(usuario.getId()).stream()
                .map(Turma::getId)
                .collect(Collectors.toSet());
        List<ResponseNotificacaoDTO> itens = notificacaoRepository.findRecentesVisiveis(usuario.getId(), LIMITE_DE_ITENS).stream()
                .map(n -> paraDTO(n, turmasDoProfessor.contains(n.getTurmaId())))
                .toList();
        int naoLidas = (int) notificacaoRepository.contarNaoLidasVisiveis(usuario.getId());
        return new ResponseNotificacoesDTO(naoLidas, itens, prazosProximos(usuario, agora));
    }

    @Transactional
    public void marcarLida(UUID id, Usuario usuario) {
        if (!notificacaoRepository.existsByIdAndUsuarioId(id, usuario.getId())) {
            throw new AppException(HttpStatus.NOT_FOUND, "Notificação não encontrada.");
        }
        notificacaoRepository.marcarLida(id, usuario.getId(), LocalDateTime.now());
    }

    @Transactional
    public void marcarTodasLidas(Usuario usuario) {
        notificacaoRepository.marcarTodasLidas(usuario.getId(), LocalDateTime.now());
    }

    // atividades abertas, nao entregues, com prazo nas proximas 48 h; nada e gravado
    private List<ResponseNotificacaoDTO> prazosProximos(Usuario aluno, LocalDateTime agora) {
        LocalDateTime limite = agora.plus(JANELA_PRAZO_PROXIMO);
        return atividadeRepository.findDisponiveisParaAluno(aluno.getId()).stream()
                .filter(a -> !a.getPrazoFinal().isBefore(agora) && !a.getPrazoFinal().isAfter(limite))
                .filter(a -> !entregaRepository.existsByAtividadeIdAndAlunoId(a.getId(), aluno.getId()))
                .map(a -> new ResponseNotificacaoDTO(
                        "prazo-" + a.getId(),
                        "PRAZO_PROXIMO",
                        textoDoPrazo(a, agora),
                        a.getTurma().getId(),
                        a.getId(),
                        null,
                        a.getPrazoFinal(),
                        true,
                        false))
                .toList();
    }

    private String textoDoPrazo(Atividade a, LocalDateTime agora) {
        LocalDateTime prazo = a.getPrazoFinal();
        String quando;
        if (prazo.toLocalDate().equals(agora.toLocalDate())) {
            quando = "hoje";
        } else if (prazo.toLocalDate().equals(agora.toLocalDate().plusDays(1))) {
            quando = "amanhã";
        } else {
            quando = "em " + DIA.format(prazo);
        }
        return cortar("O prazo de " + a.getNome() + " termina " + quando + " às " + HORA.format(prazo) + ".");
    }

    private ResponseNotificacaoDTO paraDTO(Notificacao n, boolean paraProfessor) {
        return new ResponseNotificacaoDTO(
                n.getId().toString(),
                n.getTipo().name(),
                n.getTexto(),
                n.getTurmaId(),
                n.getAtividadeId(),
                n.getAvisoId(),
                n.getCriadaEm(),
                n.getLidaEm() != null,
                paraProfessor);
    }

    private static String cortar(String texto) {
        return texto.length() <= TAMANHO_MAXIMO_DO_TEXTO ? texto : texto.substring(0, TAMANHO_MAXIMO_DO_TEXTO);
    }
}

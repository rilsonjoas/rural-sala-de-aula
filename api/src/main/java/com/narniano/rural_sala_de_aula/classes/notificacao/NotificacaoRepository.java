package com.narniano.rural_sala_de_aula.classes.notificacao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    boolean existsByIdAndUsuarioId(UUID id, UUID usuarioId);

    // so turmas em que o usuario ainda e professor ou esta inscrito
    String TURMAS_DO_USUARIO = "(n.turma_id IN (SELECT t.id FROM turma t WHERE t.professor_id = :usuarioId) "
            + "OR n.turma_id IN (SELECT i.turma_id FROM inscricao i WHERE i.aluno_id = :usuarioId))";

    @Query(value = "SELECT n.* FROM notificacao n WHERE n.usuario_id = :usuarioId AND " + TURMAS_DO_USUARIO
            + " ORDER BY n.criada_em DESC LIMIT :limite", nativeQuery = true)
    List<Notificacao> findRecentesVisiveis(@Param("usuarioId") UUID usuarioId, @Param("limite") int limite);

    @Query(value = "SELECT COUNT(*) FROM notificacao n WHERE n.usuario_id = :usuarioId AND n.lida_em IS NULL AND " + TURMAS_DO_USUARIO,
            nativeQuery = true)
    long contarNaoLidasVisiveis(@Param("usuarioId") UUID usuarioId);

    /** Cria "atividade nova" para as atividades ja abertas das turmas do aluno que ainda nao tem a notificacao. */
    @Modifying(clearAutomatically = true)
    @Query(value = "INSERT INTO notificacao (id, usuario_id, tipo, texto, turma_id, atividade_id, criada_em) "
            + "SELECT gen_random_uuid(), :usuarioId, 'ATIVIDADE_NOVA', "
            + "left('Nova atividade em ' || t.nome || ': ' || a.nome || '.', 300), a.turma_id, a.id, a.disponivel_em "
            + "FROM atividade a "
            + "JOIN turma t ON t.id = a.turma_id "
            + "JOIN inscricao i ON i.turma_id = a.turma_id AND i.aluno_id = :usuarioId "
            + "WHERE a.disponivel_em <= :agora AND a.disponivel_em >= :desde AND a.disponivel_em >= i.criado_em "
            + "ON CONFLICT (usuario_id, atividade_id) WHERE tipo = 'ATIVIDADE_NOVA' DO NOTHING", nativeQuery = true)
    int criarAtividadesNovas(@Param("usuarioId") UUID usuarioId,
                             @Param("agora") LocalDateTime agora,
                             @Param("desde") LocalDateTime desde);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE notificacao SET lida_em = :agora WHERE id = :id AND usuario_id = :usuarioId AND lida_em IS NULL", nativeQuery = true)
    int marcarLida(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId, @Param("agora") LocalDateTime agora);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE notificacao SET lida_em = :agora WHERE usuario_id = :usuarioId AND lida_em IS NULL", nativeQuery = true)
    int marcarTodasLidas(@Param("usuarioId") UUID usuarioId, @Param("agora") LocalDateTime agora);
}

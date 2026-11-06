-- RF17: central de notificacoes dentro do app (sino). Prazo proximo nao e gravado: e calculado na leitura.
CREATE TABLE notificacao (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    texto VARCHAR(300) NOT NULL,
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    atividade_id UUID REFERENCES atividade(id) ON DELETE CASCADE,
    aviso_id UUID REFERENCES aviso(id) ON DELETE CASCADE,
    criada_em TIMESTAMP(6) NOT NULL,
    lida_em TIMESTAMP(6)
);
CREATE INDEX notificacao_usuario_idx ON notificacao (usuario_id, criada_em DESC);
-- "atividade nova" e gerada na leitura; o indice evita duplicata em chamadas simultaneas
CREATE UNIQUE INDEX notificacao_atividade_nova_uk ON notificacao (usuario_id, atividade_id) WHERE tipo = 'ATIVIDADE_NOVA';

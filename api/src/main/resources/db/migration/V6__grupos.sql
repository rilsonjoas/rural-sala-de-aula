-- Grupos (RF06, RF07 e RF12): estado do grupo, integrantes e regras por turma.
-- A tabela grupo ainda nao era usada por nenhum endpoint; os grupos antigos (se houver) ficam APROVADOS.
ALTER TABLE grupo ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APROVADO'
    CHECK (status IN ('PENDENTE', 'APROVADO', 'REPROVADO'));
ALTER TABLE grupo ALTER COLUMN status DROP DEFAULT;
ALTER TABLE grupo ADD COLUMN criado_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL;
ALTER TABLE grupo ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT now();

CREATE TABLE grupo_integrante (
    id UUID PRIMARY KEY,
    grupo_id UUID NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    entrou_em TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT grupo_integrante_unico UNIQUE (grupo_id, aluno_id)
);
CREATE INDEX grupo_integrante_aluno_idx ON grupo_integrante (aluno_id);

CREATE TABLE configuracao_grupos (
    turma_id UUID PRIMARY KEY REFERENCES turma(id) ON DELETE CASCADE,
    minimo_integrantes INTEGER NOT NULL CHECK (minimo_integrantes >= 1),
    maximo_integrantes INTEGER NOT NULL,
    maximo_grupos INTEGER CHECK (maximo_grupos IS NULL OR maximo_grupos >= 1),
    CONSTRAINT configuracao_grupos_faixa CHECK (maximo_integrantes >= minimo_integrantes)
);

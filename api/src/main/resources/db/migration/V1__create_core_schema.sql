CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    email VARCHAR(320) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuario_email_unique ON usuario (lower(email));

CREATE TABLE turma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES usuario(id),
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    disciplina VARCHAR(120) NOT NULL CHECK (length(btrim(disciplina)) > 0),
    semestre VARCHAR(10) NOT NULL CHECK (semestre ~ '^[0-9]{4}\.[12]$'),
    dias_aula SMALLINT[] NOT NULL DEFAULT '{}' CHECK (dias_aula <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]),
    codigo VARCHAR(8) NOT NULL CHECK (codigo ~ '^[A-Za-z0-9]{6,8}$'),
    descricao VARCHAR(1000),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX turma_codigo_unique ON turma (upper(codigo));
CREATE INDEX turma_professor_idx ON turma (professor_id);

CREATE TABLE inscricao (
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (turma_id, aluno_id)
);
CREATE INDEX inscricao_aluno_idx ON inscricao (aluno_id);

CREATE TABLE atividade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL CHECK (length(btrim(nome)) > 0),
    descricao VARCHAR(4000),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PROVA', 'LISTA_DE_EXERCICIO', 'PROJETO_INDIVIDUAL', 'PROJETO_EM_GRUPO')),
    prazo_final TIMESTAMPTZ NOT NULL,
    disponivel_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    aceita_atraso BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT atividade_datas_validas CHECK (prazo_final >= disponivel_em)
);
CREATE INDEX atividade_turma_idx ON atividade (turma_id);

CREATE TABLE entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_id UUID NOT NULL REFERENCES atividade(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id),
    nota NUMERIC(4,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
    comentario_privado VARCHAR(4000),
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT entrega_unica_por_aluno UNIQUE (atividade_id, aluno_id)
);
CREATE INDEX entrega_atividade_idx ON entrega (atividade_id);
CREATE INDEX entrega_aluno_idx ON entrega (aluno_id);

CREATE TABLE arquivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID NOT NULL REFERENCES entrega(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_armazenado VARCHAR(255) NOT NULL UNIQUE,
    caminho VARCHAR(500) NOT NULL,
    tipo_conteudo VARCHAR(100) NOT NULL,
    tamanho BIGINT NOT NULL,
    data_envio TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX arquivo_entrega_idx ON arquivo (entrega_id);

CREATE TABLE aviso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    texto VARCHAR(3000) NOT NULL,
    horario TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX aviso_turma_idx ON aviso (turma_id);

CREATE TABLE comentario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aviso_id UUID NOT NULL REFERENCES aviso(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    comentario_pai_id UUID REFERENCES comentario(id) ON DELETE CASCADE,
    texto VARCHAR(3000) NOT NULL,
    horario TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comentario_aviso_idx ON comentario (aviso_id);

CREATE TABLE grupo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);
CREATE INDEX grupo_turma_idx ON grupo (turma_id);

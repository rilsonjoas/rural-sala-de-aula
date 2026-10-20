CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    email VARCHAR(320) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    CONSTRAINT usuario_email_unique UNIQUE (email)
);

CREATE TABLE turma (
    id UUID PRIMARY KEY,
    professor_id UUID NOT NULL REFERENCES usuario(id),
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    disciplina VARCHAR(120) NOT NULL CHECK (length(btrim(disciplina)) > 0),
    semestre VARCHAR(10) NOT NULL CHECK (semestre ~ '^[0-9]{4}\.[12]$'),
    codigo VARCHAR(8) NOT NULL,
    descricao VARCHAR(1000),
    CONSTRAINT turma_codigo_unique UNIQUE (codigo)
);
CREATE INDEX turma_professor_idx ON turma (professor_id);

CREATE TABLE turma_dias_aula (
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    dia_aula INTEGER CHECK (dia_aula BETWEEN 1 AND 7)
);
CREATE INDEX turma_dias_aula_turma_idx ON turma_dias_aula (turma_id);

CREATE TABLE inscricao (
    id UUID PRIMARY KEY,
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    criado_em TIMESTAMP(6) NOT NULL,
    CONSTRAINT inscricao_unica_por_aluno UNIQUE (turma_id, aluno_id)
);
CREATE INDEX inscricao_aluno_idx ON inscricao (aluno_id);

CREATE TABLE atividade (
    id UUID PRIMARY KEY,
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL CHECK (length(btrim(nome)) > 0),
    descricao VARCHAR(4000),
    tipo VARCHAR(255) NOT NULL CHECK (tipo IN ('PROVA', 'LISTA_DE_EXERCICIO', 'PROJETO_INDIVIDUAL', 'PROJETO_EM_GRUPO')),
    prazo_final TIMESTAMP(6) NOT NULL,
    disponivel_em TIMESTAMP(6) NOT NULL,
    aceita_atraso BOOLEAN NOT NULL
);
CREATE INDEX atividade_turma_idx ON atividade (turma_id);

CREATE TABLE grupo (
    id UUID PRIMARY KEY,
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);
CREATE INDEX grupo_turma_idx ON grupo (turma_id);

-- Entrega usa heranca JOINED: a tabela base guarda o que e comum,
-- entrega_individual e entrega_em_grupo guardam quem entregou.
CREATE TABLE entrega (
    id UUID PRIMARY KEY,
    atividade_id UUID NOT NULL REFERENCES atividade(id) ON DELETE CASCADE,
    nota NUMERIC(4,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
    comentario_privado VARCHAR(4000),
    enviada_em TIMESTAMP(6) NOT NULL
);
CREATE INDEX entrega_atividade_idx ON entrega (atividade_id);

CREATE TABLE entrega_individual (
    id UUID PRIMARY KEY REFERENCES entrega(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id)
);
CREATE INDEX entrega_individual_aluno_idx ON entrega_individual (aluno_id);

CREATE TABLE entrega_em_grupo (
    id UUID PRIMARY KEY REFERENCES entrega(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupo(id)
);
CREATE INDEX entrega_em_grupo_grupo_idx ON entrega_em_grupo (grupo_id);

CREATE TABLE arquivo (
    id UUID PRIMARY KEY,
    entrega_id UUID NOT NULL REFERENCES entrega(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_armazenado VARCHAR(255) NOT NULL,
    caminho VARCHAR(255) NOT NULL,
    tipo_conteudo VARCHAR(255) NOT NULL,
    tamanho BIGINT NOT NULL,
    data_envio TIMESTAMP(6) NOT NULL,
    CONSTRAINT arquivo_nome_armazenado_unique UNIQUE (nome_armazenado)
);
CREATE INDEX arquivo_entrega_idx ON arquivo (entrega_id);

CREATE TABLE aviso (
    id UUID PRIMARY KEY,
    turma_id UUID NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    texto VARCHAR(3000) NOT NULL,
    horario TIMESTAMP(6) NOT NULL
);
CREATE INDEX aviso_turma_idx ON aviso (turma_id);

CREATE TABLE comentario (
    id UUID PRIMARY KEY,
    aviso_id UUID NOT NULL REFERENCES aviso(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    comentario_pai_id UUID REFERENCES comentario(id) ON DELETE CASCADE,
    texto VARCHAR(3000) NOT NULL,
    horario TIMESTAMP(6) NOT NULL
);
CREATE INDEX comentario_aviso_idx ON comentario (aviso_id);

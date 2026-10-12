CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE papel_usuario AS ENUM ('ALUNO', 'PROFESSOR');
CREATE TYPE atividade_tipo AS ENUM ('ATIVIDADE', 'TRABALHO', 'PROVA');
CREATE TYPE atividade_modalidade AS ENUM ('INDIVIDUAL', 'GRUPO');
CREATE TYPE atividade_complexidade AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    email VARCHAR(320) NOT NULL,
    hash_senha VARCHAR(255) NOT NULL,
    papel papel_usuario NOT NULL,
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
    complexidade atividade_complexidade NOT NULL,
    tipo atividade_tipo NOT NULL,
    modalidade atividade_modalidade NOT NULL DEFAULT 'INDIVIDUAL',
    prazo_final TIMESTAMPTZ NOT NULL,
    disponivel_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT atividade_datas_validas CHECK (prazo_final >= disponivel_em)
);
CREATE INDEX atividade_turma_idx ON atividade (turma_id);

CREATE TABLE entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_id UUID NOT NULL REFERENCES atividade(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id),
    arquivo_chave VARCHAR(500) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT entrega_unica_por_aluno UNIQUE (atividade_id, aluno_id)
);

CREATE TABLE avaliacao (
    entrega_id UUID PRIMARY KEY REFERENCES entrega(id) ON DELETE CASCADE,
    nota NUMERIC(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),
    comentario_privado VARCHAR(4000),
    avaliada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION exige_papel() RETURNS trigger AS $$
DECLARE
    esperado papel_usuario := TG_ARGV[0]::papel_usuario;
    uid UUID;
    atual papel_usuario;
BEGIN
    uid := (to_jsonb(NEW) ->> TG_ARGV[1])::uuid;
    SELECT papel INTO atual FROM usuario WHERE id = uid;
    IF atual IS DISTINCT FROM esperado THEN
        RAISE EXCEPTION 'usuario % precisa ter papel %', uid, esperado USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER turma_professor_papel BEFORE INSERT OR UPDATE OF professor_id ON turma
    FOR EACH ROW EXECUTE FUNCTION exige_papel('PROFESSOR', 'professor_id');
CREATE TRIGGER inscricao_aluno_papel BEFORE INSERT OR UPDATE OF aluno_id ON inscricao
    FOR EACH ROW EXECUTE FUNCTION exige_papel('ALUNO', 'aluno_id');
CREATE TRIGGER entrega_aluno_papel BEFORE INSERT OR UPDATE OF aluno_id ON entrega
    FOR EACH ROW EXECUTE FUNCTION exige_papel('ALUNO', 'aluno_id');

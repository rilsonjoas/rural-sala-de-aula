CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE periodo_status AS ENUM ('ABERTO', 'ARQUIVADO');
CREATE TYPE tarefa_tipo AS ENUM ('TAREFA', 'TRABALHO', 'OUTRO');
CREATE TYPE tarefa_prioridade AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE tarefa_status AS ENUM ('PENDENTE', 'CONCLUIDA');
CREATE TYPE notificacao_evento AS ENUM ('TAREFA', 'PROVA', 'AULA');

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    email VARCHAR(320) NOT NULL,
    hash_senha VARCHAR(255),
    idioma VARCHAR(10) NOT NULL DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en')),
    fuso_horario VARCHAR(64) NOT NULL DEFAULT 'America/Recife',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX usuario_email_normalized_unique ON usuario (lower(email));

CREATE TABLE periodo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    data_inicio DATE,
    data_fim DATE,
    status periodo_status NOT NULL DEFAULT 'ABERTO',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT periodo_datas_validas CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX periodo_usuario_unico_aberto ON periodo (usuario_id) WHERE status = 'ABERTO';

CREATE TABLE disciplina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES periodo(id) ON DELETE CASCADE,
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    cor CHAR(7) CHECK (cor IS NULL OR cor ~ '^#[0-9A-Fa-f]{6}$'),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT disciplina_id_periodo_unique UNIQUE (id, periodo_id)
);

CREATE TABLE tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciplina_id UUID NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL CHECK (length(btrim(titulo)) > 0),
    descricao VARCHAR(4000),
    tipo tarefa_tipo,
    prioridade tarefa_prioridade,
    status tarefa_status NOT NULL DEFAULT 'PENDENTE',
    prazo_em TIMESTAMPTZ,
    concluida_em TIMESTAMPTZ,
    tags TEXT[] NOT NULL DEFAULT '{}',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tarefa_status_consistente CHECK (
        (status = 'PENDENTE' AND concluida_em IS NULL)
        OR (status = 'CONCLUIDA' AND concluida_em IS NOT NULL)
    )
);

CREATE TABLE prova (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciplina_id UUID NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL CHECK (length(btrim(titulo)) > 0),
    data_prova TIMESTAMPTZ NOT NULL,
    peso NUMERIC(5, 2) CHECK (peso IS NULL OR (peso >= 0 AND peso <= 100)),
    nota NUMERIC(5, 2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 100)),
    observacoes VARCHAR(4000),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES periodo(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT horario_periodo_disciplina_fk FOREIGN KEY (disciplina_id, periodo_id)
        REFERENCES disciplina(id, periodo_id) ON DELETE CASCADE,
    CONSTRAINT horario_horario_valido CHECK (fim > inicio)
);

CREATE TABLE cancelamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID NOT NULL REFERENCES horario(id) ON DELETE CASCADE,
    data_cancelamento DATE NOT NULL,
    motivo VARCHAR(500),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cancelamento_horario_data_unique UNIQUE (horario_id, data_cancelamento)
);

CREATE TABLE config_notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    evento notificacao_evento NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    antecedencias_minutos INTEGER[] NOT NULL DEFAULT '{1440}' CHECK (cardinality(antecedencias_minutos) > 0 AND 0 < ALL(antecedencias_minutos)),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT config_notificacao_usuario_evento_unique UNIQUE (usuario_id, evento)
);

CREATE INDEX periodo_usuario_idx ON periodo (usuario_id);
CREATE INDEX disciplina_periodo_idx ON disciplina (periodo_id);
CREATE INDEX tarefa_disciplina_idx ON tarefa (disciplina_id);
CREATE INDEX tarefa_prazo_idx ON tarefa (prazo_em) WHERE prazo_em IS NOT NULL;
CREATE INDEX prova_disciplina_data_idx ON prova (disciplina_id, data_prova);
CREATE INDEX horario_periodo_dia_idx ON horario (periodo_id, dia_semana);
CREATE INDEX cancelamento_horario_data_idx ON cancelamento (horario_id, data_cancelamento);

CREATE OR REPLACE FUNCTION atualizar_timestamp() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER usuario_atualizado_em
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER periodo_atualizado_em
    BEFORE UPDATE ON periodo
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER disciplina_atualizado_em
    BEFORE UPDATE ON disciplina
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tarefa_atualizado_em
    BEFORE UPDATE ON tarefa
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER prova_atualizado_em
    BEFORE UPDATE ON prova
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER horario_atualizado_em
    BEFORE UPDATE ON horario
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER config_notificacao_atualizado_em
    BEFORE UPDATE ON config_notificacao
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- Invariante: um cancelamento só existe para uma data que realmente cai no dia da aula.
-- Sem esta guarda, POST /horarios/{id}/cancelamentos aceita qualquer data e grava lixo
-- silenciosamente (CHECK não valida isso: não pode referenciar outra tabela).
CREATE OR REPLACE FUNCTION validar_dia_do_cancelamento() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    dia_aula SMALLINT;
BEGIN
    SELECT dia_semana INTO dia_aula FROM horario WHERE id = NEW.horario_id;
    IF dia_aula IS NULL THEN
        RAISE EXCEPTION 'horario % não existe', NEW.horario_id USING ERRCODE = '23503';
    END IF;
    IF EXTRACT(ISODOW FROM NEW.data_cancelamento)::SMALLINT <> dia_aula THEN
        RAISE EXCEPTION 'a data % é dia ISO % e a aula é dia ISO %',
            NEW.data_cancelamento, EXTRACT(ISODOW FROM NEW.data_cancelamento), dia_aula
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cancelamento_data_confere_dia_semana
    BEFORE INSERT OR UPDATE ON cancelamento
    FOR EACH ROW EXECUTE FUNCTION validar_dia_do_cancelamento();

-- Invariante: trocar o dia da aula deixaria os cancelamentos apontando para a data errada
-- (a aula reaparece no dia antigo e some no novo). Bloqueia enquanto houver exceções.
CREATE OR REPLACE FUNCTION bloquear_mudanca_de_dia_com_cancelamento() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dia_semana IS DISTINCT FROM OLD.dia_semana
        AND EXISTS (SELECT 1 FROM cancelamento WHERE horario_id = OLD.id) THEN
        RAISE EXCEPTION 'a aula % tem cancelamentos registrados no dia ISO %; desfaça-os antes de mudar o dia',
            OLD.id, OLD.dia_semana
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER horario_dia_semana_bloqueado_com_cancelamento
    BEFORE UPDATE ON horario
    FOR EACH ROW EXECUTE FUNCTION bloquear_mudanca_de_dia_com_cancelamento();

-- Antecedências do MVP: fixas, sem tela de preferências (RF12 adiado).
-- Semear por trigger, e não por código de aplicação, tem duas consequências:
--   1. nenhum caminho de criação de usuário pode esquecer de criar as três linhas;
--   2. sendo o trigger o único escritor, os únicos valores que existem na tabela são
--      estes — as brechas do CHECK (sem teto, sem dedup) ficam inalcançáveis por construção.
-- Quando RF12 voltar, estas passam a ser o default que o aluno poderá sobrescrever,
-- e não o lugar onde a verdade mora.
CREATE OR REPLACE FUNCTION semear_preferencias_notificacao() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO config_notificacao (usuario_id, evento, antecedencias_minutos) VALUES
        (NEW.id, 'TAREFA', '{1440}'),
        (NEW.id, 'PROVA', '{10080, 4320, 1440}'),
        (NEW.id, 'AULA', '{1440}');
    RETURN NEW;
END;
$$;

CREATE TRIGGER usuario_preferencias_notificacao_padrao
    AFTER INSERT ON usuario
    FOR EACH ROW EXECUTE FUNCTION semear_preferencias_notificacao();

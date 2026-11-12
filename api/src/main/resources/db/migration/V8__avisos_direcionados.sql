-- RF13: aviso para a turma toda (padrao) ou direcionado a grupos e alunos especificos.
-- Os grupos sao expandidos para os alunos no momento da publicacao; aviso_destinatario guarda quem recebe.
ALTER TABLE aviso ADD COLUMN alcance VARCHAR(20) NOT NULL DEFAULT 'TURMA'
    CHECK (alcance IN ('TURMA', 'DIRECIONADO'));

CREATE TABLE aviso_destinatario (
    aviso_id UUID NOT NULL REFERENCES aviso(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    PRIMARY KEY (aviso_id, aluno_id)
);
CREATE INDEX aviso_destinatario_aluno_idx ON aviso_destinatario (aluno_id);

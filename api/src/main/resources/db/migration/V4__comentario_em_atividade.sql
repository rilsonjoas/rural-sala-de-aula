-- RF14: comentarios tambem em atividade. Cada comentario pertence a um aviso OU a uma atividade.
ALTER TABLE comentario ALTER COLUMN aviso_id DROP NOT NULL;
ALTER TABLE comentario ADD COLUMN atividade_id UUID REFERENCES atividade(id) ON DELETE CASCADE;
ALTER TABLE comentario ADD CONSTRAINT comentario_alvo_unico CHECK ((aviso_id IS NOT NULL) <> (atividade_id IS NOT NULL));
CREATE INDEX comentario_atividade_idx ON comentario (atividade_id);

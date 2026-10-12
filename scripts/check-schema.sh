#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
C=rsa-schema-check
docker rm -f "$C" >/dev/null 2>&1 || true
docker run -d --name "$C" -e POSTGRES_PASSWORD=x postgres:16-alpine >/dev/null
trap 'docker rm -f "$C" >/dev/null 2>&1' EXIT
until docker exec "$C" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 2
q() { docker exec -i "$C" psql -U postgres -v ON_ERROR_STOP=1 -q -t -A "$@"; }
q < "$ROOT/api/src/main/resources/db/migration/V1__create_core_schema.sql"

expect_fail() { # $1=descrição, stdin=SQL
  if q >/dev/null 2>&1; then printf 'FALHOU (deveria ser rejeitado): %s\n' "$1" >&2; exit 1; fi
  printf 'ok  rejeitado: %s\n' "$1"
}

q <<'SQL'
INSERT INTO usuario (id,nome,email,hash_senha,papel) VALUES
 ('00000000-0000-0000-0000-000000000001','Prof','p@x.br','h','PROFESSOR'),
 ('00000000-0000-0000-0000-000000000002','Aluno','a@x.br','h','ALUNO');
INSERT INTO turma (id,professor_id,nome,disciplina,semestre,dias_aula,codigo) VALUES
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','T1','Algoritmos','2026.2','{1,3}','ABC123');
INSERT INTO inscricao (turma_id,aluno_id) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
INSERT INTO atividade (id,turma_id,nome,complexidade,tipo,modalidade,prazo_final,disponivel_em) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Lista 1','MEDIA','ATIVIDADE','INDIVIDUAL',now()+interval '8 day',now());
INSERT INTO entrega (id,atividade_id,aluno_id,arquivo_chave,nome_original) VALUES
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','k1','lista.pdf');
INSERT INTO avaliacao (entrega_id,nota,comentario_privado) VALUES ('30000000-0000-0000-0000-000000000001',9.5,'bom');
SQL
echo "ok  caminho feliz"

expect_fail "e-mail duplicado (case-insensitive)" <<'SQL'
INSERT INTO usuario (nome,email,hash_senha,papel) VALUES ('X','A@X.BR','h','ALUNO');
SQL
expect_fail "turma criada por ALUNO" <<'SQL'
INSERT INTO turma (professor_id,nome,disciplina,semestre,dias_aula,codigo) VALUES ('00000000-0000-0000-0000-000000000002','T','D','2026.2','{1}','ZZZ999');
SQL
expect_fail "código de turma duplicado" <<'SQL'
INSERT INTO turma (professor_id,nome,disciplina,semestre,dias_aula,codigo) VALUES ('00000000-0000-0000-0000-000000000001','T','D','2026.2','{1}','abc123');
SQL
expect_fail "inscrição duplicada" <<'SQL'
INSERT INTO inscricao (turma_id,aluno_id) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
SQL
expect_fail "inscrição de PROFESSOR" <<'SQL'
INSERT INTO inscricao (turma_id,aluno_id) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
SQL
expect_fail "segunda entrega do mesmo aluno na atividade" <<'SQL'
INSERT INTO entrega (atividade_id,aluno_id,arquivo_chave,nome_original) VALUES ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','k2','b.pdf');
SQL
expect_fail "nota acima de 10" <<'SQL'
UPDATE avaliacao SET nota = 10.5;
SQL
expect_fail "prazo_final antes da disponibilidade" <<'SQL'
INSERT INTO atividade (turma_id,nome,complexidade,tipo,modalidade,prazo_final,disponivel_em) VALUES ('10000000-0000-0000-0000-000000000001','Y','BAIXA','ATIVIDADE','INDIVIDUAL',now()-interval '1 day',now());
SQL
echo "Schema OK."

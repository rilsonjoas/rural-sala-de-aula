#!/usr/bin/env bash
# Verificação das invariantes que vivem no schema, não no código.
#
# Por que isto existe e não uma suíte de testes: o projeto não tem CI, então um
# teste só vale se rodar junto de algo que já roda. As invariantes de
# `cancelamento`, `horario` e `config_notificacao` são garantidas por trigger no
# Postgres — se uma migration futura derrubar um `CREATE TRIGGER`, nada mais
# avisa. Este script é a rede dessa ausência, e roda em segundos.
#
# Requer apenas docker (usa postgres:16-alpine direto, sem subir o compose).
# SKIP_DB=1 pula a verificação.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MIGRATION="api/src/main/resources/db/migration/V1__create_core_schema.sql"
CONTAINER="rota-invariant-check"

if [[ "${SKIP_DB:-0}" == "1" ]]; then
  printf 'SKIP_DB=1: verificação de invariantes pulada.\n'
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  printf 'ERRO: docker ausente; rode com SKIP_DB=1 para pular.\n' >&2
  exit 1
fi

if [[ ! -f "$MIGRATION" ]]; then
  printf 'ERRO: migration ausente: %s\n' "$MIGRATION" >&2
  exit 1
fi

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

fail=0
check() { # check <descrição> <esperado: PASS|FAIL> <saída observada>
  if [[ "$3" == *"$2"* ]]; then
    printf '  ok   %s\n' "$1"
  else
    printf '  FALHA %s\n     esperado: %s\n     obtido:   %s\n' "$1" "$2" "$3"
    fail=1
  fi
}

printf 'Verificando invariantes do schema...\n'

cleanup
docker run -d --name "$CONTAINER" \
  -e POSTGRES_USER=rota -e POSTGRES_PASSWORD=rota -e POSTGRES_DB=check \
  postgres:16-alpine >/dev/null

# `pg_isready` sozinho não serve: durante o init o entrypoint sobe um servidor
# temporário que responde e é desligado logo em seguida, o que produz a corrida
# "the database system is shutting down". Espera uma consulta real succeed duas
# vezes seguidas, com um segundo de intervalo.
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" psql -U rota -d check -tAq -c 'SELECT 1' >/dev/null 2>&1; then
    sleep 1
    if docker exec "$CONTAINER" psql -U rota -d check -tAq -c 'SELECT 1' >/dev/null 2>&1; then
      ready=1
      break
    fi
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  printf 'ERRO: o Postgres de check não ficou pronto.\n' >&2
  exit 1
fi

docker cp "$MIGRATION" "$CONTAINER:/tmp/migration.sql" >/dev/null

if ! docker exec "$CONTAINER" psql -U rota -d check -v ON_ERROR_STOP=1 -q -f /tmp/migration.sql >/tmp/migration.log 2>&1; then
  printf 'ERRO: a migration não aplica do zero.\n' >&2
  cat /tmp/migration.log >&2
  exit 1
fi
printf '  ok   migration aplica do zero\n'

# Sem `-q`: o quiet suprime as tags de comando (`UPDATE 1`, `INSERT 0 1`) que são
# justamente o sinal esperado nos casos positivos. Nos casos de recusa, o texto
# do ERROR é o sinal.
q() { docker exec "$CONTAINER" psql -U rota -d check -tA -c "$1" 2>&1; }

# Cenário: uma aula na quarta-feira (dia ISO 4).
docker exec -i "$CONTAINER" psql -U rota -d check -q <<'SQL' >/dev/null
INSERT INTO usuario (nome, email) VALUES ('Ana', 'ana@check.dev');
INSERT INTO periodo (usuario_id, nome) SELECT id, '2026.2' FROM usuario LIMIT 1;
INSERT INTO disciplina (periodo_id, nome) SELECT id, 'Calculo' FROM periodo LIMIT 1;
INSERT INTO horario (periodo_id, disciplina_id, dia_semana, inicio, fim)
  SELECT p.id, d.id, 4, '19:00', '20:40' FROM periodo p, disciplina d LIMIT 1;
SQL

printf 'Cancelamento:\n'
check 'recusa data que não é o dia da aula' \
  'dia ISO 5 e a aula é dia ISO 4' \
  "$(q "INSERT INTO cancelamento (horario_id, data_cancelamento) SELECT id, '2026-10-16' FROM horario LIMIT 1;")"
check 'recusa data repetida' \
  'cancelamento_horario_data_unique' \
  "$(q "INSERT INTO cancelamento (horario_id, data_cancelamento) SELECT id, '2026-10-15' FROM horario LIMIT 1;"; \
     q "INSERT INTO cancelamento (horario_id, data_cancelamento) SELECT id, '2026-10-15' FROM horario LIMIT 1;")"
check 'recusa mover o dia da aula com cancelamento vivo' \
  'desfaça-os antes de mudar o dia' \
  "$(q "UPDATE horario SET dia_semana = 5;")"

# Garante um cancelamento válido para o cenário de mover o dia. Idempotente,
# porque o check anterior já pode ter deixado um no lugar.
q "INSERT INTO cancelamento (horario_id, data_cancelamento)
   SELECT id, '2026-10-15' FROM horario LIMIT 1
   ON CONFLICT (horario_id, data_cancelamento) DO NOTHING;" >/dev/null || true

printf 'Horario e prova:\n'
check 'aceita mudar o horário mantendo o dia' \
  'UPDATE 1' \
  "$(q "UPDATE horario SET inicio = '19:15';")"
check 'aceita prova sem peso (o caso do MVP)' \
  'INSERT 0 1' \
  "$(q "INSERT INTO prova (disciplina_id, titulo, data_prova) SELECT id, 'Prova 1', '2026-10-20 19:00' FROM disciplina LIMIT 1;")"
check 'recusa peso acima de 100' \
  'prova_peso_check' \
  "$(q "INSERT INTO prova (disciplina_id, titulo, data_prova, peso) SELECT id, 'X', '2026-11-03 19:00', 150 FROM disciplina LIMIT 1;")"

printf 'Tarefa (minima do MVP):\n'
check 'aceita tarefa so com titulo (o caso do MVP)' \
  'INSERT 0 1' \
  "$(q "INSERT INTO tarefa (disciplina_id, titulo) SELECT id, 'Ler capitulo 3' FROM disciplina LIMIT 1;")"
check 'aceita tipo e prioridade quando o aluno quiser' \
  'INSERT 0 1' \
  "$(q "INSERT INTO tarefa (disciplina_id, titulo, tipo, prioridade) SELECT id, 'Relatorio', 'TRABALHO', 'ALTA' FROM disciplina LIMIT 1;")"
check 'concluir exige concluida_em coerente com o status' \
  'tarefa_status_consistente' \
  "$(q "UPDATE tarefa SET status = 'CONCLUIDA' WHERE concluida_em IS NULL;")"

printf 'Antecedencias semeadas:\n'
check 'usuario novo nasce com 3 linhas' \
  '3' \
  "$(q "SELECT count(*) FROM config_notificacao;")"
check 'prova usa a cascata 7-3-1' \
  '{10080,4320,1440}' \
  "$(q "SELECT antecedencias_minutos::text FROM config_notificacao WHERE evento = 'PROVA' LIMIT 1;")"

if [[ "$fail" -ne 0 ]]; then
  printf '\nInvariantes do schema: FALHOU.\n' >&2
  exit 1
fi

printf '\nInvariantes do schema: OK.\n'

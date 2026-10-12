#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

required_tools=(docker node npm)
for tool in "${required_tools[@]}"; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'ERRO: ferramenta obrigatória ausente: %s\n' "$tool" >&2
    exit 1
  fi
done

required_files=(
  .env.example
  docker-compose.yml
  docs/openapi.yaml
  api/pom.xml
  api/.env.example
  api/src/main/resources/db/migration/V1__create_core_schema.sql
  front/package.json
  front/components.json
  front/src/lib/api.generated.ts
)
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'ERRO: arquivo obrigatório ausente: %s\n' "$file" >&2
    exit 1
  fi
done

docker compose config --quiet

if command -v python3 >/dev/null 2>&1 && python3 -c 'import yaml' >/dev/null 2>&1; then
  python3 - <<'PY'
from pathlib import Path
import yaml

with Path('docs/openapi.yaml').open(encoding='utf-8') as stream:
    document = yaml.safe_load(stream)
assert document['openapi'] == '3.0.3'
assert '/health' in document['paths']
schemas = document['components']['schemas']
for name in ('Usuario', 'Turma', 'Atividade', 'Entrega', 'AvaliacaoInput'):
    assert name in schemas, name
assert 'papel' in schemas['Usuario']['properties']
assert 'prazoFinal' in schemas['AtividadeInput']['properties']
assert '/inscricoes' in document['paths']
assert 'get' in document['paths']['/atividades']
PY
else
  printf 'AVISO: PyYAML ausente; a validação do OpenAPI foi pulada.\n'
fi

if [[ ! -f .env ]]; then
  printf 'AVISO: .env ausente. Use .env.example para o ambiente local.\n'
fi

if [[ ! -d front/node_modules ]]; then
  printf 'AVISO: front/node_modules ausente. Rode npm install em front/.\n'
fi

printf 'Preflight OK: estrutura, Compose e contrato presentes.\n'

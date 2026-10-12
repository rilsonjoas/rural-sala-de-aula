#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash scripts/preflight.sh
bash scripts/check-schema.sh

npm --prefix front run typecheck
npm --prefix front run lint
npm --prefix front audit --audit-level=high
npm --prefix front run test
npm --prefix front run build

if [[ "${SKIP_E2E:-0}" != "1" ]]; then
  npm --prefix front run test:e2e
fi

docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2 -v "$ROOT/api:/workspace" -w /workspace maven:3.9-eclipse-temurin-21 mvn -B test

printf 'Verificação completa concluída.\n'

# api/

Backend **Spring Boot** (Java 21): REST + JPA + Flyway + PostgreSQL.

- **Fase 0:** contrato de API em [`../docs/openapi.yaml`](../docs/openapi.yaml), resumo em [`../docs/api.md`](../docs/api.md), migration inicial em `src/main/resources/db/migration/V1__create_core_schema.sql` e health check em `GET /api/v1/health`.
- **Fase 1:** `usuario` + auth por e-mail/senha (cookie httpOnly, refresh rotativo, rate limit; Google OAuth fica para depois, RF13/P3), `periodo`, `disciplina`, `tarefa`/`prova`, `horario` + `cancelamento`.
- **Fase 2:** job cron de web push (tarefa 24h; prova 7-3-1).
- **Fase 3:** módulo `gamificacao` (eventos de domínio → XP/nível/streak/conquistas).

## Desenvolvimento

A partir da raiz do projeto, com Docker, a API sobe junto com o banco:

```bash
docker compose up --build rota-estudo-api
```

Para executar os testes sem Maven instalado no host:

```bash
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2 -v "$PWD:/workspace" -w /workspace maven:3.9-eclipse-temurin-21 mvn test
```

A documentação HTTP fica em `/swagger-ui.html` e o JSON em `/v3/api-docs`. A configuração usa `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `FRONT_ORIGINS` e `PORT`.

Testes: JUnit 5; Mockito fica reservado para os testes de serviço da Fase 1. Migrações: Flyway, com V1 versionada. O banco de produção é o `rota_de_estudo_db` no Postgres compartilhado do Hetzner; o compose local é apenas de desenvolvimento. Runbook: [`../../hetzner-infra/rota-de-estudo/README.md`](../../hetzner-infra/rota-de-estudo/README.md).

Ver ADRs em `../docs/adr/` e glossário em `../CONTEXT.md`.

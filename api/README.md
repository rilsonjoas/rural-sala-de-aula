# api/

Backend **Spring Boot** (Java 21): REST + JPA + Flyway + PostgreSQL. Responsável: Luiz Felipe.

- Contrato: [`../docs/openapi.yaml`](../docs/openapi.yaml). Schema dos P1: `src/main/resources/db/migration/V1__create_core_schema.sql`. Health: `GET /api/v1/health`.
- Decisões: [autenticação (aceita: cookie httpOnly)](../docs/adr/0004-autenticacao.md); [armazenamento dos arquivos (em aberto)](../docs/adr/0003-armazenamento-de-entregas.md); [prazos e entregas](../docs/adr/0006-regras-de-prazo-e-entrega.md).
- O que o back ainda precisa fazer está em [`../docs/BACKLOG.md`](../docs/BACKLOG.md) (seção Back-end).

## Desenvolvimento

```bash
docker compose up --build rural-sala-de-aula-api   # a partir da raiz
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2 -v "$PWD:/workspace" -w /workspace maven:3.9-eclipse-temurin-21 mvn test
```

Swagger em `/swagger-ui.html`. Configuração: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `FRONT_ORIGINS`, `PORT`. Glossário em `../CONTEXT.md`.

# Briefing da reunião — Rilson + Luiz

Documento de entrada para apresentar o StudyPath em 20–30 minutos. A reunião não precisa explicar o código; precisa alinhar pessoas, fronteiras e critérios de pronto.

## Pitch

O Rota de Estudo é uma agenda acadêmica web-first para organizar o semestre: aulas, prazos, provas, calendário, lembretes e uma gamificação leve. Nasce como PWA, com backend Spring Boot e PostgreSQL, e pode virar app nativo depois.

## O que já está decidido

- Monorepo com `api/` e `front/`.
- API: Spring Boot 3.5, Java 21, JPA, Flyway e PostgreSQL.
- Frontend: Vite, React, TypeScript, Tailwind e shadcn/ui.
- Contrato de integração: OpenAPI em [`openapi.yaml`](openapi.yaml), cobrindo auth, períodos, disciplinas, tarefas, provas, horários e cancelamentos.
- Tipos do frontend são gerados a partir do contrato.
- Migration inicial do domínio já está versionada.
- Interface **em português** no MVP (Fases 1–3). O texto de interface vive num dicionário de chaves desde o primeiro commit, o que mantém a porta do inglês aberta sem custo; o catálogo em inglês e a troca de idioma são da Fase 4 (ADR-0003).
- Produção: banco `rota_de_estudo_db` no `postgres-shared` da VPS Hetzner, role isolada `rota_app`, Traefik e containers na `proxy-network`.
- O Compose local é somente desenvolvimento; não é o banco de produção.
- shadcn/ui é a base de componentes. A identidade visual será neutra e orientada a ferramenta; a Rota não herda o Design Narniano.

## Estado atual

A Fase 0 está pronta: contrato, tipos, migration, shell da SPA, health check, testes, Compose local, base visual e esqueleto de produção documentado. Ainda não houve deploy, criação do banco real, DNS, Uptime Kuma ou dados de usuário.

## Fronteira proposta

- **API:** dono da modelagem Spring, persistência, migrations, autenticação, jobs e regras de domínio.
- **Frontend:** dono da experiência Vite/React, componentes shadcn, telas, estado de interface e integração com a API.
- **Contrato:** a API desenha a primeira versão; o frontend valida o consumo. Mudança incompatível passa por revisão do OpenAPI e regeneração dos tipos.
- **Primeira fatia vertical:** usuário/sessão → período → disciplina → uma tarefa/prova → tela Hoje.

A divisão final depende do nível real de cada um em React e Java, não de hierarquia.

## Perguntas para o Luiz

1. Onde você está mais confortável: React ou Java?
2. O que quer aprender neste projeto?
3. Prefere revisão por pull request, conversa presencial ou outro formato?
4. O que você considera “acabado” em uma tarefa?
5. Qual regra de convivência ou técnica quer incluir?
6. Pode rodar o projeto localmente com Docker sem depender de produção?

## Regras propostas

- Uma conversa curta por semana, com responsáveis e bloqueios.
- Teste da própria frente antes de pedir revisão.
- Uma mudança pequena por commit e mensagem clara.
- Segredo nunca entra no repositório.
- Alteração no servidor é combinada antes; o acesso de produção fica sob controle do Rilson.
- O contrato é a fronteira; discutir recursos no Slack, não no código.

## Demo local

```bash
cp .env.example .env
cp front/.env.example front/.env.local
docker compose up --build
```

- Frontend: `http://localhost:8081`
- API: `http://localhost:8080`
- Health: `http://localhost:8080/api/v1/health`
- Swagger local: `http://localhost:8080/swagger-ui.html`

## Saída obrigatória da reunião

- [ ] Donos de `api/` e `front/` definidos.
- [ ] Contrato tem um responsável e um revisor.
- [ ] Primeira entrega da Fase 1 com prazo.
- [ ] Cadência, canal e regra de review.
- [ ] Confirmação de acesso local e regras do servidor.
- [ ] Próxima fatia vertical registrada como tarefa.

## Documentos de apoio

- [`docs/api.md`](api.md) — convenções do contrato.
- [`docs/engineering.md`](engineering.md) — alinhamento P0–P9.
- [`docs/DESIGN.md`](DESIGN.md) — shadcn/ui e direção visual.
- [`docs/pre-meeting.md`](pre-meeting.md) — checklist técnico.
- [`../hetzner-infra/rota-de-estudo/README.md`](../hetzner-infra/rota-de-estudo/README.md) — runbook de produção.

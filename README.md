# Rural Sala de Aula

Alternativa ao Google Classroom focada em organizar as atividades de quem está em várias turmas: professores administram turmas, atividades e avaliações; alunos entram nas turmas, acompanham e entregam.

> **Dupla:** Luiz Felipe (back-end) · Rilson Joás (front-end) · **Entrega dos requisitos P1: 19/10/2026**

## Stack

| Camada | Escolha |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind + shadcn/ui (ADR-0002) |
| Backend | Spring Boot (Java 21) + JPA + Flyway (ADR-0001) |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose |

## Escopo da entrega (P1), em ordem de construção

| # | RF | O que faz | Quem |
|---|---|---|---|
| 1 | RF01 | Cadastro e login (nome, e-mail, senha) | todos |
| 2 | RF09 | Cadastrar turmas (nome, disciplina, semestre, dias de aula) | professor |
| 3 | RF02 | Inscrever-se em turma pelo código | aluno |
| 4 | RF03 | Consultar as turmas em que está inscrito | aluno |
| 5 | RF10 | Cadastrar atividades (prazo final, complexidade, tipo, modalidade, disponibilidade) | professor |
| 6 | RF05 | Acessar e organizar atividades (filtros e ordenação) | aluno |
| 7 | RF15 | Avaliar entrega (nota e comentário privado) | professor |
| 8 | RF04 | Entregar atividade (upload de arquivo) — **por último** | aluno |
| 9 | RF16 | Acessar e baixar entregas — **por último** | professor |

RF04 e RF16 continuam P1, mas só entram depois dos demais (reunião de 08/10/2026).

## Backlog (sem data)

Tudo o que não é P1 está em [`docs/BACKLOG.md`](docs/BACKLOG.md): RF03b, RF06, RF07, RF08, RF11, RF12, RF13, RF14, RF17, os RNF, a logo própria e as pendências do back-end.

> O documento de requisitos numera duas vezes o RF03. Aqui, "Consultar turma" é RF03 e "Sair da turma" é RF03b.

## Como rodar

```bash
cp .env.example .env
docker compose up -d db
npm --prefix front install
npm --prefix front run dev
bash scripts/verify.sh   # preflight, schema, front (typecheck/lint/test/build/e2e) e api
```

## Estrutura

- `api/` — Spring Boot e migrations Flyway
- `front/` — SPA React
- `docs/openapi.yaml` — contrato entre front e back; tipos do front saem dele (`npm --prefix front run generate:api`)
- `docs/adr/` — decisões de arquitetura
- `docs/DESIGN.md`, `docs/design/telas.md` — design e especificação das telas do front
- `docs/requisitos.md` — texto de origem dos requisitos e onde o projeto decidiu diferente
- `docs/BACKLOG.md` — o que fica para depois do P1
- `CONTEXT.md` — glossário e invariantes do domínio

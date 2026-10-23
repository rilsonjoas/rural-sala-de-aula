# Rural Sala de Aula

Alternativa ao Google Classroom focada em organizar as atividades de quem está em várias turmas: quem cria uma turma a administra (atividades e avaliações) e quem entra nela pelo código acompanha e entrega. O papel é contextual por turma: a mesma pessoa pode ser professora numa e aluna em outra (ADR-0008).

> **Dupla:** Luiz Felipe (back-end) · Rilson Joás (front-end) · **Entrega dos requisitos P1: 19/10/2026**

## Stack

| Camada | Escolha |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (ADR-0002) |
| Backend | Spring Boot (Java 21) + JPA + Flyway (ADR-0001) |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose |

## Escopo da entrega (P1), em ordem de construção

| # | RF | O que faz | Quem |
|---|---|---|---|
| 1 | RF01 | Cadastro e login (nome, e-mail, senha, data de nascimento opcional) | todos |
| 2 | RF09 | Cadastrar turmas (nome, disciplina, semestre, dias de aula) | quem leciona |
| 3 | RF02 | Inscrever-se em turma pelo código | quem estuda |
| 4 | RF03 | Consultar as turmas em que leciona ou está inscrito | todos |
| 5 | RF10 | Cadastrar atividades (nome, descrição, tipo, prazo final, disponibilidade, envio com atraso) | quem leciona |
| 6 | RF05 | Acessar e organizar atividades (filtros por estado, tipo e turma; ordenação por prazo) | quem estuda |
| 7 | RF15 | Avaliar entrega (nota e comentário privado) | quem leciona |
| 8 | RF04 | Entregar atividade (upload de arquivo) — **por último** | quem estuda |
| 9 | RF16 | Acessar e baixar entregas — **por último** | quem leciona |
| 10 | RF13 | Postar avisos no mural da turma | quem leciona |
| 11 | RF14 | Comentar nos avisos | todos da turma |

**Fora do escopo por decisão (RF10 e RF05):** a atividade **não tem complexidade nem modalidade**. A modalidade é o próprio tipo (`PROJETO_EM_GRUPO` é em grupo), então o filtro por tipo a cobre; a complexidade não foi implementada, e portanto não há filtro nem ordenação por ela. Decisão confirmada com o Luiz Felipe; o texto original está em [`docs/requisitos.md`](docs/requisitos.md) com o registro.

RF13 e RF14 entraram no front depois da lista original (aba Mural da turma). RF04 e RF16 continuam P1, mas só entram depois dos demais (reunião de 08/10/2026).

**Estado (19/10/2026):** os nove requisitos P1 estão implementados no front, no back-end e no banco, e **em produção** em `https://rural-sala-de-aula.narniano.com`. Verificado de ponta a ponta contra a API real:

- `scripts/smoke-p1.py` (API, 100 verificações: casos felizes, permissões entre usuários, validações, limites de upload, avisos e comentários, envios simultâneos, bloqueio de outra origem e limite de tentativas de login);
- `npm run test:e2e:real` em `front/` (jornada pela interface: cadastro, turma, atividade, entrada por código, filtro, entrega, download, avaliação e nota);
- `npm test` (265 testes do front contra a API simulada), `npm run typecheck`, `npm run lint` e `npm run build`.

Os dois primeiros também rodam contra produção (`python3 -I scripts/smoke-p1.py https://rural-sala-de-aula.narniano.com/api/v1` e `E2E_BASE_URL=https://rural-sala-de-aula.narniano.com npm run test:e2e:real`). Eles criam usuários `@teste.rural`; a limpeza fica no repositório de infraestrutura (`hetzner-infra`, passo de limpeza dos testes).

A API simulada (`front/src/mocks/`, `VITE_API_MOCK=true`) continua servindo para desenvolver o front sem o back. O guia de integração original está em [`docs/INTEGRACAO.md`](docs/INTEGRACAO.md).

## Roadmap

O que falta para endurecer o que já está no ar (rate limit no login, versão e volta, sessão persistente, CI, hash dos arquivos), as decisões de escopo e o que depende de gente: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Backlog (sem data)

Tudo o que não é P1 está em [`docs/BACKLOG.md`](docs/BACKLOG.md): RF03b, RF06, RF07, RF08, RF11, RF12, RF17, os RNF, a logo própria e as pendências do back-end.

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
- `docs/INTEGRACAO.md` — guia de integração front–back (onde está a especificação, ordem, contrato que mudou)
- `docs/BACKLOG.md` — o que fica para depois do P1
- `CONTEXT.md` — glossário e invariantes do domínio

# Integração front–back (guia para o back-end)

Escrito em 12/10/2026 para o Luiz. O front dos nove requisitos P1 está no `main` (PR #1) e roda contra uma **API simulada**. Este guia diz onde está o que o back precisa e em que ordem integrar.

## Como ver o front funcionando

```bash
cd front
npm install
VITE_API_MOCK=true VITE_API_MOCK_USER=aluna npm run dev   # ou professor
```

Usuários de teste: `maria@ufrpe.br` (só aluna), `paulo@ufrpe.br` (professor da Turma A e da C, aluno nas turmas B, D e E) e `carla@ufrpe.br` (professora das demais), senha `senha1234`. Os dados ficam na memória da aba; recarregar volta ao início.

## Onde está a especificação

| O que | Onde |
|---|---|
| Contrato oficial (14 caminhos do P1) | `docs/openapi.yaml` |
| Regras do domínio e invariantes do banco | `CONTEXT.md` |
| Schema | `api/src/main/resources/db/migration/V1__create_core_schema.sql`, provado por `scripts/check-schema.sh` |
| Decisões (Spring Boot, auth em cookie, arquivos, estado derivado, prazos, papel livre) | `docs/adr/` |
| Comportamento esperado de cada endpoint | `front/src/mocks/`: `domain.ts` (regras), `handlers/` (um arquivo por área: auth, turmas, atividades, entregas, projeções), `fixtures.ts` (dados de exemplo) |
| Testes dessas regras | `front/src/mocks/domain.test.ts` (estado derivado do prazo, código da turma, filtros e ordenação); `api-simulada.test.ts` (inscrição 404/409/403, entrega no prazo e atrasada, reenvio bloqueado depois da avaliação 409, tipo 415 e tamanho 413, nota entre 0 e 10, permissões do professor da turma); `handlers.test.ts` (cadastro com e-mail repetido 409) |
| Telas e o endpoint que cada uma chama | `docs/design/telas.md` e `docs/design/plano-de-design.md` §8 |

A API simulada é uma **especificação executável**: se o back responder como `handlers/` responde, a tela funciona sem mudança.

## Ordem de integração

auth → turmas → inscrições → atividades → Minhas atividades → entregas e avaliação → envio e download.

| Etapa | RF | `operationId` |
|---|---|---|
| 1 | RF01 | `register`, `login`, `logout`, `getMe` |
| 2 | RF09 | `listTurmas`, `createTurma` |
| 3 | RF02, RF03 | `enrollTurma` (`POST /inscricoes`), `listTurmas` |
| 4 | RF10 | `getTurma`, `listAtividades`, `createAtividade` |
| 5 | RF05 | `listMinhasAtividades` |
| 6 | RF15, RF16 | `getAtividade`, `listEntregas`, `evaluateEntrega`, `downloadEntrega` |
| 7 | RF04 | `submitEntrega` |

Cada etapa troca o mock pelo endpoint real: sem `VITE_API_MOCK=true`, o front fala com a API por proxy em `/api` (`VITE_API_PROXY_TARGET`).

## O contrato mudou durante o front

Refletido no `openapi.yaml`, **ainda não implementado nem confirmado** (detalhe em `docs/design/plano-de-design.md` §4):

- `Turma`: `professorNome`, `atividadesPendentes`, `atividadesAtrasadas` (só aluno).
- `Atividade`: `nota` (só aluno, quando avaliada), `estado` e `minhaEntrega` no detalhe; `disponivelEm` sempre presente. `modalidade` e `complexidade` saíram do contrato (o tipo já diz se é em grupo).
- `EntregaIndividual`: `alunoNome` e `tamanhoBytes`.
- `TurmaInput.diasAula` com ao menos um dia.
- `GET /atividades` com filtros de estado, tipo e turma, ordenados por prazo.
- Papel contextual por turma (ADR-0008): `RegisterRequest` sem `papel`; `GET /turmas` devolve as turmas que a pessoa leciona (com `codigo`) e as que cursa (com contadores); `GET /atividades` só das turmas em que é aluna; criar turma é aberto a qualquer conta.
- `submitEntrega` responde 403 para o professor da própria turma e para atividade que não aceita atraso com o prazo vencido.
- Mural: `GET/POST /turmas/{id}/avisos` e `POST /avisos/{id}/comentarios` (RF13 e RF14).
- `submitEntrega` responde 413 (tamanho), 415 (tipo) e 409 (já avaliada).

## Falta decidir ou implementar

- Spring Security com sessão em cookie httpOnly (ADR-0004) e proteção contra CSRF.
- Todos os endpoints do contrato (hoje só o health check).
- Onde ficam os arquivos (ADR-0003: volume Docker em disco recomendado para 19/10; bucket S3 como alternativa).
- Confirmar prazo final único no RF10 e entrega individual em atividade "Em grupo".
- Lista completa do que fica fora do P1: `docs/BACKLOG.md`.

# Contrato de API — Fase 0

O contrato de integração do StudyPath está em [`openapi.yaml`](openapi.yaml). Esse arquivo é a fonte de referência para a API Spring e para o frontend React.

## Estado

- Contrato: definido para autenticação, períodos, disciplinas, tarefas, provas, horários e cancelamentos.
- Tipos: o frontend usa `front/src/lib/api.generated.ts`, gerado por `npm run generate:api` a partir do OpenAPI.
- Schema: a migration inicial versionada está em `api/src/main/resources/db/migration/V1__create_core_schema.sql`.
- Health check: `GET /api/v1/health` faz parte do esqueleto da Fase 0.
- CRUD e autenticação: pertencem à Fase 1; os endpoints abaixo descrevem a fronteira antes da implementação.
- Formato: OpenAPI 3.0.3, com JSON, UUID e datas ISO-8601.

## Convenções

- Prefixo da API: `/api/v1`.
- Recursos autenticados usam o cookie httpOnly `rota_session`; tokens não vão para `localStorage`.
- IDs são UUIDs.
- Instantes usam RFC 3339 com offset, por exemplo `2026-09-25T14:30:00-03:00`.
- Horários recorrentes usam hora local no formato `HH:mm`; o fuso do usuário decide a interpretação.
- `Weekday` mapeia `MONDAY=1` até `SUNDAY=7` na coluna `dia_semana`; a semana começa na segunda.
- Períodos usam `startsOn` e `endsOn` porque representam datas civis, não instantes; provas e tarefas usam `startsAt`/`dueAt` quando representam instantes.
- Concluir uma tarefa exige `status=CONCLUIDA` e `completedAt`; o estado e o instante precisam ser coerentes.
- Paginação começa em zero, usa `page` e `size`, e limita `size` a 100.
- Recursos de outra conta respondem `404`, sem revelar se o ID existe.
- `config_notificacao.antecedencias_minutos` é uma lista para suportar a cascata de provas (7-3-1) e o prazo único de tarefas. No MVP os valores são **fixos e semeados por trigger** — ver `CONTEXT.md`; por isso não há endpoint de preferências.
- Erros seguem `ApiError`, com `code`, `message`, `requestId` e `timestamp`.

## Pendências do contrato

Itens já previstos nos requisitos (README e documento de visão) que ainda não estão no `openapi.yaml`:

- **Login com Google (RF13, P3):** endpoints de início e callback do OAuth, e o vínculo com a conta por e-mail. `usuario.hash_senha` já é anulável para contas sem senha.
- **Cancelamento em data passada (UC05, FE01):** `POST /horarios/{horarioId}/cancelamentos` deve recusar `date` anterior a hoje no fuso do usuário, com `400` e um `code` específico em `ApiError`.
- **Erro de invariante (`23514`):** as triggers de `cancelamento` e `horario` levantam `23514`; falta o `@RestControllerAdvice` que traduz para `400` com `code` em `ApiError`.
- **Preferências de notificação (RF12, adiado):** fora do MVP de propósito. A tabela existe, mas o contrato não ganha endpoint até RF12 voltar — e quando voltar, é revisão de contrato, não adendo.

## Ordem de implementação

1. `GET /api/v1/health` e o proxy entre os serviços.
2. Sessão, `usuario` e autorização por dono.
3. `periodo` e `disciplina`.
4. `tarefa` e `prova`.
5. `horario` e `cancelamento`.
6. Telas Hoje, Semana e Mês.

A divisão entre API e frontend deve seguir este contrato; mudanças incompatíveis precisam de uma nova revisão do OpenAPI e de uma ADR quando afetarem a arquitetura.

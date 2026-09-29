# front/

Frontend **Vite + React + TypeScript + Tailwind + shadcn/ui**.

- **Fase 0 (pronta):** contrato de API em [`../docs/openapi.yaml`](../docs/openapi.yaml), tipos gerados em `src/lib/api.generated.ts`, shell da SPA com rotas Hoje, Semana e Mês, health check da API, base shadcn/ui e dicionário de chaves com **português ativo**.
- **Fase 1 (o MVP, apresentado na 2ª VA):** login por e-mail/senha; CRUD de período, disciplina, tarefa, prova, horário e cancelamento; telas **Hoje** e **Semana** (mobile-first, táctil, modais de criar/editar); **gamificação mínima** — uma faixa no header com nível, pontos, "faltam N tarefas" e sequência de dias. Sem visão de Mês, sem realce de colisões, sem push.
  - O formulário de tarefa no MVP é **só título, prazo e concluída** (`tipo` e `prioridade` ficam no schema, sem tela).
  - `GET /gamificacao/perfil` devolve `tarefasConcluidas, xpTotal, nivel, proximoNivel, tarefasParaProximoNivel, streakAtual, streakRecorde` — tudo derivado de `tarefa`, sem tabela de XP.
- **Fase 2 (pós-apresentação):** manifest + service worker, inscrição em web push (VAPID) e o job de lembrete. As preferências de notificação estão **adiadas** — as antecedências ficam fixas no MVP.
- **Fase 3:** conquistas, cálculo de média e nota por prova (dependem da escala da nota, ADR-0007).
- **Fase 4:** i18n EN, acessibilidade e profissionalização. O catálogo `en` **não** está pronto: hoje existem 18 chaves do shell da Fase 0 (ADR-0003).

## Desenvolvimento

```bash
npm install
npm run dev
```

O Vite encaminha `/api` para `VITE_API_PROXY_TARGET` (por padrão, `http://localhost:8080`). Para gerar a imagem servida pelo Nginx:

```bash
npm run build
```

Testes: Vitest + Testing Library; E2E: Playwright. Para regenerar os tipos a partir do contrato, rode `npm run generate:api`. Tokens e direção visual estão em [`../docs/DESIGN.md`](../docs/DESIGN.md).

Ver ADRs em `../docs/adr/` e glossário em `../CONTEXT.md`.

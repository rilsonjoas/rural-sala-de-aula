# front/

Frontend **Vite + React + TypeScript + Tailwind + shadcn/ui**.

- **Fase 0:** contrato de API em [`../docs/openapi.yaml`](../docs/openapi.yaml), tipos gerados em `src/lib/api.generated.ts`, shell da SPA com rotas Hoje/Semana/Mês, health check da API e base shadcn/ui.
- **Fase 1:** telas **Hoje / Semana / Mês** (mobile-first, táctil, colisões destacadas, modais de criar/editar); login por e-mail/senha (Google OAuth fica para depois, RF13/P3); CRUD de período/disciplina/tarefa/prova/horário + cancelamento.
- **Fase 2:** inscrição + recepção de web push (VAPID), preferências.
- **Fase 3:** XP/nível/streak/conquistas na UI.
- **Fase 4:** i18n EN (catálogo en já preparado no shell), acessibilidade e profissionalização; a base shadcn/ui já está configurada.

## Desenvolvimento

```bash
npm install
npm run dev
```

O Vite encaminha `/api` para `VITE_API_PROXY_TARGET` (por padrão, `http://localhost:8080`). Para gerar a imagem servida pelo Nginx:

```bash
npm run build
```

Testes: Vitest + Testing Library; E2E: Playwright. Para regenerar os tipos a partir do contrato, rode `npm run generate:api`. Tokens e direção visual estão em [`../docs/design.md`](../docs/design.md).

Ver ADRs em `../docs/adr/` e glossário em `../CONTEXT.md`.

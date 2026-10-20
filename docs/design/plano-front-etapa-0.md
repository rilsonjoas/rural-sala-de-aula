# Front — Etapa 0 (fundação): plano de implementação

**Objetivo:** deixar o front pronto para receber as telas dos P1: dados, sessão, guardas, shell, componentes compartilhados e uma API simulada para trabalhar sem o back-end.

**Branch:** `front/etapa-0`. **Referências:** [`telas.md`](telas.md), [`plano-de-design.md`](plano-de-design.md) §5–§8, [`../DESIGN.md`](../DESIGN.md), contrato [`../openapi.yaml`](../openapi.yaml).

## Decisões (09/10/2026)

| Tema | Decisão |
|---|---|
| API enquanto o back não existe | **MSW** com dados de teste e estado em memória; liga por `VITE_API_MOCK=true`; serve também aos testes |
| Dados | **TanStack Query** + **openapi-fetch** (tipos de `api.generated.ts`) |
| Formulários | **react-hook-form** + **zod** (+ `@hookform/resolvers`) |
| Git | commits por tarefa nesta branch; você revisa e faz o merge |

## Restrições globais

- Textos só em português, exatamente como em `telas.md`. Sem i18n.
- Tokens da UFRPE (DESIGN.md §2); amarelo nunca como texto; vermelho só em atraso e erro; verde só em Concluída.
- Alvos de toque ≥ 44 px; foco visível; ordem do DOM = ordem visual.
- Teste primeiro (RED → GREEN) em tudo que tem lógica: cliente da API, guardas, formatadores, selos.
- Nenhuma chamada à API real por padrão nos testes: tudo passa pelo MSW.
- `bash scripts/verify.sh` verde ao fim de cada tarefa.

## Revisão: casos que o contrato implica e o teste precisa cobrir

1. Sessão expirada (401 em qualquer chamada) → volta a `/entrar` com "Sua sessão expirou. Entre de novo."
2. Aluno abrindo rota de professor (e o inverso) → redireciona a `/turmas`, sem piscar a tela errada.
3. 422 com `Problem.campos` → a mensagem aparece no campo certo, não só em toast.
4. Resposta de rede quebrada/offline → `ErrorState` com "Tentar de novo", sem tela branca.
5. Data fora do ano atual e nota com vírgula ("9,5") formatadas como em DESIGN.md "Convenções de exibição".

---

## Tarefa 1 — Dependências e cliente da API

**Arquivos:** `front/package.json`; criar `src/lib/api-client.ts`, `src/lib/api-error.ts`, `src/lib/query-client.ts`; alterar `src/lib/api.ts` (remover `getHealth`, que não é mais usado); alterar `src/main.tsx` (providers); testes `src/lib/api-error.test.ts`, `src/lib/api-client.test.ts`.

**Produz:** `api` (cliente `createClient<paths>` com `baseUrl` de `VITE_API_URL ?? '/api/v1'` e `credentials: 'include'`); `ApiError { status, message, campos?: {campo, mensagem}[] }`; `queryClient`.

- [ ] Instalar: `npm i @tanstack/react-query openapi-fetch react-hook-form zod @hookform/resolvers sonner lucide-react` e `npm i -D msw`.
- [ ] **Teste (RED):** `toApiError(response)` transforma um corpo `Problem` em `ApiError` com `campos`; corpo inválido vira `ApiError` genérico com a mensagem "Algo deu errado. Tente de novo."; 401 marca `status: 401`.
- [ ] Implementar `api-error.ts` e o middleware do cliente que lança `ApiError` para respostas não-2xx.
- [ ] **Teste (RED):** o cliente emite um evento `session-expired` ao receber 401 fora de `/auth/login`.
- [ ] Implementar; configurar `queryClient` (sem retry em 4xx, 1 retry em rede) e envolver o `App` em `QueryClientProvider` e `Toaster`.
- [ ] Rodar `npm run typecheck && npm run test`. Commit.

## Tarefa 2 — API simulada (MSW)

**Arquivos:** criar `src/mocks/{db.ts,fixtures.ts,handlers.ts,browser.ts,server.ts}`; alterar `src/test/setup.ts` e `src/main.tsx`; `public/mockServiceWorker.js` (gerado por `npx msw init public/`); teste `src/mocks/handlers.test.ts`.

**Produz:** `server` (testes) e `worker` (navegador); `resetDb()`; fixtures de 1 professor, 2 alunos, 3 turmas, atividades em todos os 5 estados.

- [ ] **Teste (RED):** `POST /api/v1/auth/login` com credencial válida devolve `Usuario` e define a sessão; inválida devolve 401 `Problem`; `GET /me` sem sessão devolve 401; `POST /auth/register` com e-mail repetido devolve 409.
- [ ] Implementar `db.ts` (estado em memória, sessão por variável) e os handlers de **auth** e **health**. Os demais endpoints entram em cada etapa, junto com a tela.
- [ ] `setup.ts`: `server.listen({ onUnhandledRequest: 'error' })`, `resetDb()` e `server.resetHandlers()` a cada teste.
- [ ] `main.tsx`: se `import.meta.env.VITE_API_MOCK === 'true'`, `await worker.start()` antes de renderizar. Documentar em `front/.env.example`.
- [ ] Rodar testes. Commit.

## Tarefa 3 — Sessão e guardas de rota

**Arquivos:** criar `src/features/session/{use-session.ts,guards.tsx}`; alterar `src/App.tsx`; testes `guards.test.tsx`.

**Consome:** `api`, `ApiError`. **Produz:** `useSession(): { usuario?: Usuario, isLoading, logout }`; `<RequireAuth>`, `<RequireRole papel="PROFESSOR">`, `<PublicOnly>`.

- [ ] **Testes (RED), com MSW:** visitante em `/turmas` vai a `/entrar`; logado em `/entrar` vai a `/turmas`; aluno em `/atividades/:id/entregas` vai a `/turmas`; professor em `/atividades` vai a `/turmas`; evento `session-expired` limpa a sessão e leva a `/entrar` com a mensagem; enquanto carrega, mostra esqueleto (não pisca a tela errada).
- [ ] Implementar `useSession` (query `['me']`, `retry: false`) e as guardas.
- [ ] Reorganizar as rotas de `App.tsx` conforme `plano-de-design.md` §5. As páginas continuam placeholders. Commit.

## Tarefa 4 — Componentes base e tokens

**Arquivos:** `src/components/ui/*` (shadcn), `src/styles.css`.

- [ ] `npx shadcn@latest add input label textarea select toggle-group tabs sheet dialog dropdown-menu badge skeleton progress` (estilo `new-york`, Tailwind 4) e `npm i tw-animate-css`; importar no `styles.css`.
- [ ] Ajustar `Button` para altura mínima 44 px e criar a variante `destructive`; conferir que nenhum componente usa amarelo como cor de texto.
- [ ] **Teste de fumaça:** renderiza `Input` com `Label` e acha o campo pelo rótulo; `Button` tem `min-height` ≥ 44 px. `npm run build`. Commit.

## Tarefa 5 — Shell e navegação por papel

**Arquivos:** criar `src/components/shell/{app-shell.tsx,header.tsx,avatar-menu.tsx,bottom-nav.tsx,sidebar.tsx}`, `src/pages/not-found.tsx`; testes `app-shell.test.tsx`.

- [ ] **Testes (RED):** aluno vê "Turmas" e "Atividades"; professor vê só "Turmas"; o menu do avatar mostra nome, papel e "Sair" (chama `logout`); a marca é o texto "Rural Sala de Aula" com o capelo (`GraduationCap`, `aria-hidden`); rota inexistente mostra "Página não encontrada" e o botão "Voltar para Turmas".
- [ ] Implementar: mobile (< 640 px) cabeçalho + barra inferior só para aluno; ≥ 1024 px menu lateral de 240 px; 640–1023 px cabeçalho com menu. Remover as classes antigas do shell em `styles.css`.
- [ ] Conferir no navegador a 360 px e 1280 px (`npm run dev` com `VITE_API_MOCK=true`). Commit.

## Tarefa 6 — Componentes compartilhados e formatadores

**Arquivos:** criar `src/lib/format.ts`; `src/components/{status-badge,empty-state,error-state,responsive-sheet}.tsx`; testes ao lado de cada um.

**Produz:** `formatDataHora(iso, agora)`, `formatNota(n)`, `formatDias(dias[])`, `formatPrazoRelativo(prazoFinal, agora)`; `<StatusBadge estado>`, `<EmptyState titulo descricao acao>`, `<ErrorState mensagem onRetry>`, `<ResponsiveSheet>`.

- [ ] **Testes (RED) dos formatadores:** `15/10 às 23:59`; com ano só se diferente ("15/10/2027 às 23:59"); nota `9,5` e `8,0`; dias `[1,3]` → "Seg · Qua", `[6,7]` → "Sáb · Dom"; relativo: "Restam 2 dias", "Resta 1 dia", "Prazo final passou há 1 dia", "Prazo final passou há 3 dias".
- [ ] **Testes (RED) dos selos:** cada um dos 5 estados mostra ícone + texto (`Pendente`, `Entregue`, `Entregue com atraso`, `Concluída · nota 9,5`, `Atrasada`) e nunca só cor (o texto está no DOM).
- [ ] Implementar. `ResponsiveSheet` usa `Sheet` abaixo de 1024 px e `Dialog` acima, com foco preso e fechamento por Esc. `ErrorState` chama `onRetry` ao clicar em "Tentar de novo".
- [ ] Rodar `bash scripts/verify.sh`. Commit.

## Tarefa 7 — Fechamento

- [ ] Atualizar `front/README.md` (como rodar com `VITE_API_MOCK=true`, estrutura de `src/`) e o §8 do `plano-de-design.md` marcando a etapa 0 como concluída.
- [ ] `bash scripts/verify.sh` completo. Mensagem final com o que foi feito e o que ficou. Sem push.

---

## Estrutura de `src/` ao fim da etapa 0

```
src/
  components/ui/        shadcn
  components/shell/     cabeçalho, avatar, navegação
  components/*.tsx      selos, estados, ResponsiveSheet
  features/session/     useSession e guardas
  lib/                  api-client, api-error, query-client, format, utils, api.generated
  mocks/                MSW (db, fixtures, handlers)
  pages/                placeholders das telas
```

## Depois da etapa 0

Etapas 1 a 8 do `plano-de-design.md` §8, uma branch por etapa (`front/etapa-1-login`, ...). Cada etapa acrescenta os handlers do MSW dos endpoints que usa. **Combinar com o Luiz** a ordem de implementação dos endpoints igual à das etapas, para trocarmos o mock pelo real tela a tela.

# front/

Frontend **Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui**. Responsável: Rilson Joás. Os nove requisitos P1 estão implementados (login, turmas, atividades, Minhas atividades, avaliação, envio e download). Especificação das telas: [`../docs/design/telas.md`](../docs/design/telas.md).

## Rodar

```bash
npm install
VITE_API_MOCK=true VITE_API_MOCK_USER=aluna npm run dev   # com a API simulada, já logado
npm run dev                                               # com a API real (proxy /api → VITE_API_PROXY_TARGET)
```

Com `VITE_API_MOCK=true` o app usa a API simulada (MSW, dados na memória: a página recarregada volta ao início). `VITE_API_MOCK_USER` (ou `?mockUser=` na URL) abre a sessão como `aluna`, `aluno` ou `professor`; vazio (`?mockUser=`) abre deslogado. Usuários de teste: `maria@ufrpe.br` (aluna), `marcos@ufrpe.br` (professor), todos com a senha `senha1234`.

## Verificar

```bash
npm run typecheck && npm run lint
npm run test        # Vitest: ~260 testes (telas, regras, API simulada)
npm run test:e2e    # Playwright: jornadas de aluna e professor + auditoria de acessibilidade (axe)
npm run generate:api  # regenera src/lib/api.generated.ts a partir de ../docs/openapi.yaml
```

## Estrutura de `src/`

```
components/         selos, estados vazio/erro, folha responsiva, campos (shadcn em ui/)
components/shell/   cabeçalho, avatar, navegação, layout público
features/           uma pasta por área, com os testes ao lado
  session/          sessão (GET /me), guardas de rota
  auth/             entrar e criar conta
  turmas/           lista de turmas, Nova turma, Entrar em turma
  atividades/       atividades da turma, Minhas atividades, filtros, Nova atividade
  entregas/         entregas do professor, Avaliar, detalhe da atividade, envio
lib/                cliente da API (openapi-fetch), erros, formatadores, hooks
mocks/              API simulada (MSW): domínio, dados de exemplo e handlers, com testes
test/               setup dos testes (jsdom + MSW)
```

## Convenções

- O cliente da API tem os tipos gerados do contrato; qualquer 401 fora de `/me` e do login avisa que a sessão expirou.
- Formulários: react-hook-form + zod, erros no campo (`aplicarErroDaApi` leva o 422 para o campo certo).
- Estados de toda lista: carregando (esqueleto), vazio (ensina o que fazer), erro (com "Tentar de novo").
- Nos testes, `File`, `Blob`, `FormData` e `Request` são os do Node (o jsdom perde o nome do arquivo no multipart); ver `src/test/setup.ts`.

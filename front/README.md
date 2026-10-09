# front/

Frontend **Vite + React + TypeScript + Tailwind + shadcn/ui**. Responsável: Rilson Joás.

Estado atual: shell com rotas placeholder (Turmas, Atividades, Entrar), health check da API e tipos gerados de [`../docs/openapi.yaml`](../docs/openapi.yaml). As telas dos P1 entram na ordem do README da raiz.

```bash
npm install
npm run dev            # /api é encaminhado para VITE_API_PROXY_TARGET (padrão http://localhost:8080)
npm run generate:api   # regenera src/lib/api.generated.ts
npm run test           # Vitest; E2E com npm run test:e2e
```

# ADR-0002: Frontend em Vite + React (não Next.js)

- **Status:** accepted (2026-09-23)

## Contexto

App **autenticado** (usuário logado, SEO só de uma landing pré-login), com **PWA + web push** como pilar de UX, e API vivendo fora do front (Spring Boot). O comparativo próprio do autor: Next.js = SSG/SEO; Vite = PWA mais simples.

## Decisão

**Vite + React + TypeScript + shadcn/ui**, com plugin PWA (service worker + web push) e SPA. Documentado a pedido explícito do autor (2026-09-23).

## Consequências

- Landing pré-login é página estática leve; SEO profundo fora de escopo (irrelevante para app logado).
- Evita o conflito entre SSR do Next e cookie httpOnly do Spring.
- O PWA é o produto: não há app nas lojas, e o aviso é Web Push (ver ADR-0006).
- **Next.js permanece** a escolha nos projetos onde SEO manda (Lecionário, AlternativasBR, etc.).
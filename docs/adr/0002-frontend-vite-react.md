# ADR-0002 — Frontend em Vite + React

Status: aceito

## Contexto

App autenticado, sem necessidade de SEO.

## Decisão

Vite + React + TypeScript + Tailwind 4 (plugin `@tailwindcss/vite`, tokens em `@theme`) + shadcn/ui; tipos gerados de docs/openapi.yaml.

## Consequências

SPA servida pelo Nginx; o contrato OpenAPI é a fronteira com o back-end.

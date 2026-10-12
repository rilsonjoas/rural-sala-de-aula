# ADR-0004 — Autenticação

Status: aceito (2026-10-08) — sessão em cookie httpOnly

## Contexto

RF01 exige cadastro e login por e-mail e senha.

## Decisão

Sessão em cookie `SESSION` httpOnly, SameSite=Lax; `register` já inicia a sessão; o front só usa `GET /me`. O OpenAPI assume sessão em cookie httpOnly (cookieAuth). Alternativa: JWT.

## Consequências

Se for JWT, o contrato muda o esquema de segurança e o front guarda o token.

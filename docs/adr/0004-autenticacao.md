# ADR-0004 — Autenticação

Status: aceito (2026-10-08) e implementado (2026-10-19) — sessão em cookie httpOnly

## Contexto

RF01 exige cadastro e login por e-mail e senha.

## Decisão

Sessão em cookie httpOnly, SameSite=Lax (em produção também `Secure`, via `SESSION_COOKIE_SECURE`); o nome real é `JSESSIONID`, o da `HttpSession` do Spring; `register` já inicia a sessão; o front só usa `GET /me`. O OpenAPI assume sessão em cookie httpOnly (cookieAuth). Alternativa: JWT.

## Consequências

Se for JWT, o contrato muda o esquema de segurança e o front guarda o token.

## Como ficou (19/10/2026)

- A API usa a `HttpSession` do Spring, **sem Spring Security**. A sessão fica na memória da API: cada deploy ou reinício desloga todos (`spring-session-jdbc` resolveria; está nas pendências de infraestrutura).
- **CSRF sem token:** o cookie é `SameSite=Lax` e o CORS do Spring recusa com 403, antes do controller, qualquer requisição cujo `Origin` não seja o próprio host nem `localhost`. `scripts/smoke-p1.py` verifica o bloqueio. Rever se houver subdomínios não confiáveis ou chamadas de outra origem.
- Em produção front e API ficam no mesmo domínio (o nginx do front encaminha `/api/`), então não há CORS entre origens.
- **Limite de tentativas (22/10/2026):** contador em memória (`LimitadorDeTentativas`), janela fixa, por instância da API. No login contam só as **falhas**: 5 por e-mail e 30 por IP em 15 minutos, então uma turma inteira atrás do mesmo IP da faculdade consegue entrar. No cadastro contam todas as tentativas: 30 por IP por hora. Acima do limite a API responde 429 com `Retry-After` e mensagem em português; um login correto zera o contador do e-mail. Os números mudam por `app.rate-limit.*` sem recompilar. O IP é a primeira entrada de `X-Forwarded-For` (o Traefik sobrescreve o que o cliente manda). Limitações aceitas: quem erra a senha 5 vezes de um e-mail alheio trava esse e-mail por 15 minutos; reiniciar a API zera os contadores; só vale com uma instância.

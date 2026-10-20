# Roadmap — Rural Sala de Aula

Estado em **20/10/2026**. O escopo P1 está entregue e em produção; o que segue é endurecer o que já está no ar. O que não é P1 fica no [`BACKLOG.md`](BACKLOG.md).

## Onde estamos

| Camada | Estado | Como foi verificado |
|---|---|---|
| Front (9 requisitos P1, mais mural RF13 e RF14) | pronto, em produção | 265 testes, `tsc`, ESLint e build; jornada pela interface com a API real (`npm run test:e2e:real`, 5 testes, local e produção) |
| Back-end (todos os endpoints do `openapi.yaml`) | pronto, em produção | `scripts/smoke-p1.py`: 96 verificações (felizes, permissões, validações, limites, avisos, envios simultâneos, outra origem), local e produção |
| Banco | pronto, em produção | Flyway V1 aplicado do zero com `ddl-auto=validate`; backup e restore automático testados; 13 tabelas |
| Produção | `https://rural-sala-de-aula.narniano.com` | HTTPS, domínio único (a API fica em `/api/`), volume de uploads no backup, monitor no Uptime Kuma |

Produção roda o commit `434cdfe` ou posterior (conferir com `git -C /opt/rural-sala-de-aula log --oneline -1` na VPS).

## Decisões de escopo (não voltar a discutir sem motivo novo)

- **Complexidade e modalidade da atividade: não serão implementadas** (confirmado com o Luiz Felipe). A modalidade é o próprio tipo (`PROJETO_EM_GRUPO`). Detalhes em `requisitos.md` ("Onde o projeto decidiu diferente").
- **Sentry: não será usado neste projeto.** Os erros da API ficam nos logs do container.
- **Sem Spring Security.** A sessão é a `HttpSession` do Spring; CSRF coberto por `SameSite=Lax` e pelo CORS (ADR-0004).
- **Qualquer conta cria turma**, sem convite nem aprovação (ADR-0008). **Sem aviso de privacidade (LGPD)**, por ser um projeto universitário.
- **Domínio único** em produção, sem CORS entre origens (ADR-0004).

## Próximos passos, em ordem

| # | Item | Pilar do padrão | Por quê | Onde mexer |
|---|---|---|---|---|
| 1 | **Rate limit em `/auth/login` e `/auth/register`** | P0 Segurança | hoje qualquer um tenta senhas sem limite; é o buraco de segurança mais importante | API (filtro por IP e por e-mail) e, se couber, Traefik |
| 2 | **Versão no ar e caminho de volta** | P1 Infra | `/api/v1/health` devolve `0.0.1-SNAPSHOT`; não dá para saber qual commit está no ar nem voltar sem adivinhar | `pom.xml`/build com o commit, tag no git, `/health` com a versão, passo de rollback no runbook |
| 3 | **Desligamento gracioso e sessão persistente** | P2 Saúde | cada deploy derruba as sessões e pode cortar um envio no meio | `server.shutdown=graceful`; `spring-session-jdbc` (tabela nova via Flyway V2) |
| 4 | **CI no GitHub Actions** | P3/P4 | nada roda antes do deploy; a lição do padrão é aplicar a migration **do zero** | build da API, `mvn test`, testes do front, Flyway num Postgres limpo, `smoke-p1` contra o stack do compose |
| 5 | **Restore dos uploads com arquivo real** | P6 Backups | o teste automático só confere que o tarball está íntegro | enviar uma entrega, `make backup`, restaurar e comparar o conteúdo |
| 6 | **Hash SHA-256 do arquivo** | RNF02 | provar que a entrega não foi alterada | coluna em `arquivo` (Flyway V2), cálculo no envio, conferência no download |

O item 4 é o que dá mais retorno depois do 1: o Java só foi compilado de verdade em 19/10 e dois bugs só apareceram em produção.

## Em aberto (precisa de gente, não de código)

- **Confirmar com o Luiz:** (a) o professor define só o prazo final (ADR-0006); (b) o aluno entrega individualmente atividade "Em grupo" até o RF06 entrar. Hoje valem como decididos, mas a confirmação não está registrada.
- **Tag `luiz/servicos-originais`** (aponta para `7ea7e79`, a pasta `servicos/` dele antes da consolidação em `classes/`): existe só na máquina do Rilson. Falta publicar (`git push origin luiz/servicos-originais`) e avisar o Luiz de que `servicos/` foi consolidada em `classes/<domínio>/`. Do trabalho dele ainda valem `listarPorTurma`, `listarPorGrupo` (membros de turma e grupo) e `excluir` (usuário e turma), no padrão novo e com DTOs.
- **`hetzner-infra`:** o PR #2 (documentação do Rural em produção) foi mergeado em 20/10. Fica uma dúvida separada: o `POSTGRES_DBS` do `.env.example` ainda lista `umami_db`, que **não** está no `.env` real da VPS (se o Umami usa esse banco, ele está fora do backup; confirmar antes de mexer).

## Como retomar

```bash
# stack local (raiz do repositório)
docker compose up -d --build

# API: 96 verificações
python3 -I scripts/smoke-p1.py                      # padrão http://localhost:8081/api/v1

# interface com a API real (em front/)
npm run test:e2e:real

# front: testes, tipos, lint e build
cd front && npm test && npm run typecheck && npm run lint && npm run build
```

Publicar na VPS: `git -C /opt/rural-sala-de-aula pull --ff-only` e `make sala-up` a partir de `~/hetzner-infra`; acesso pelo Tailscale (`narniano@100.67.163.103`). Rodar o smoke contra produção cria usuários `@teste.rural`; a limpeza é `rural-sala-de-aula/limpar-testes.sh` no `hetzner-infra` (mostra primeiro, apaga só com `--apply`). Runbook completo: `hetzner-infra/rural-sala-de-aula/README.md`.

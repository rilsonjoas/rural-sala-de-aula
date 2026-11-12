# Roadmap — Rural Sala de Aula

Estado em **20/10/2026**. O escopo P1 está entregue e em produção; o que segue é endurecer o que já está no ar. O que não é P1 fica no [`BACKLOG.md`](BACKLOG.md).

## Onde estamos

| Camada | Estado | Como foi verificado |
|---|---|---|
| Front (9 requisitos P1, mais mural RF13 e RF14) | pronto, em produção | 276 testes, `tsc`, ESLint e build; jornada pela interface com a API real (`npm run test:e2e:real`, 5 testes, local e produção) |
| Back-end (todos os endpoints do `openapi.yaml`) | pronto, em produção | `scripts/smoke-p1.py`: 120 verificações (felizes, permissões, validações, limites, avisos, envios simultâneos, outra origem, limite de login), local e produção |
| Banco | pronto, em produção | Flyway V1 aplicado do zero com `ddl-auto=validate`; backup e restore automático testados; 13 tabelas |
| Produção | `https://rural-sala-de-aula.narniano.com` | HTTPS, domínio único (a API fica em `/api/`), volume de uploads no backup, monitor no Uptime Kuma |

Produção roda o commit `c8d15f1` desde 29/10 (gamificação derivada e ética com nível, XP e conquistas em aba dedicada no front; rate limit, `commit` no `/health`, sessão no Postgres, RF03b, RF11, RF14b, sem-entrega e hash); smoke de produção 120/120 e jornada pela interface 5/5. Publicar: `make sala-deploy` na VPS; conferir: `make sala-versao`.

Na branch `feat/comentarios-atividade-e-notificacoes` (05/11/2026, **sem deploy**): comentário em atividade (migration V4, `GET/POST /atividades/{id}/comentarios`) e central de notificações (migration V5, `GET /notificacoes`, marcar como lida). Local: smoke 173/173, front 321/321 (`tsc`, ESLint e build limpos), jornada pela interface 6/6, JUnit 5/5 (o `contextLoads` precisa de Postgres local). Para publicar: merge, `make sala-deploy` e rodar o smoke e a jornada contra produção.

**Grupos e entrega em grupo (12 e 13/11/2026).** Grupos (RF06, RF07 e RF12): back-end (migration V6, `GrupoService`, `GrupoController`, `GET /turmas/{id}/alunos`) e front, **em produção** em `5874a90` (smoke de produção 200/200). Entrega em nome do grupo (migration V7, **sem deploy**): em atividade `PROJETO_EM_GRUPO`, qualquer integrante de grupo aprovado envia e reenvia; o professor vê e avalia uma entrega por grupo; a nota vale para todos e todos são avisados; "quem não entregou" desconta quem está em grupo que entregou. Local: smoke 217/217, JUnit verde (sem o `contextLoads`), front 349/349, jornadas pela interface 14/14 (`npm run test:e2e:real`). Para publicar: merge, `make sala-deploy`, smoke e jornada contra produção. **RF13 completo (13/11/2026, sem deploy, migration V8):** o professor publica o aviso para a turma toda (padrão) ou só para grupos e alunos escolhidos; quem não é destinatário não vê o aviso nem os comentários (404), só os destinatários são notificados, e o professor vê para quem foi. Local: smoke 230/230, front 354/354, jornadas pela interface 15/15. **Fechamento (13/11/2026, sem deploy, sem migration nova):** calendário também para o professor (RF08, prazos das turmas que leciona); aba **Membros** na turma; **excluir turma** (`DELETE /turmas/{id}`, só o professor; sai tudo que depende dela, inclusive os arquivos do disco) e **excluir a própria conta** (`POST /me/exclusao`, exige a senha; 409 para quem ainda leciona; leva entregas individuais, comentários, inscrições e grupos); **paginação** dos avisos do mural (`limite` e `deslocamento`, total em `X-Total-Count`, "Carregar avisos mais antigos"). Local: smoke 248/248, front 362/362, jornadas pela interface 16/16, JUnit verde. Não há mais item pendente de código no escopo.

## Decisões de escopo (não voltar a discutir sem motivo novo)

- **Complexidade e modalidade da atividade: não serão implementadas** (confirmado com o Luiz Felipe). A modalidade é o próprio tipo (`PROJETO_EM_GRUPO`). Detalhes em `requisitos.md` ("Onde o projeto decidiu diferente").
- **Sentry: não será usado neste projeto.** Os erros da API ficam nos logs do container.
- **Sem Spring Security.** A sessão é a `HttpSession` do Spring; CSRF coberto por `SameSite=Lax` e pelo CORS (ADR-0004).
- **Qualquer conta cria turma**, sem convite nem aprovação (ADR-0008). **Sem aviso de privacidade (LGPD)**, por ser um projeto universitário.
- **Domínio único** em produção, sem CORS entre origens (ADR-0004).

## Próximos passos, em ordem

| # | Item | Pilar do padrão | Por quê | Onde mexer |
|---|---|---|---|---|
| 1 | ~~Rate limit em `/auth/login` e `/auth/register`~~ **feito em 22/10, em produção desde 26/10** | P0 Segurança | login: 5 falhas por e-mail e 30 por IP em 15 min; cadastro: 30 por IP por hora; acima disso 429 com `Retry-After` (ADR-0004) | `LimitadorDeTentativas`, `AuthService` |
| 2 | ~~Versão no ar e caminho de volta~~ **feito em 25/10, em produção desde 26/10**: `/health` devolve `commit`, `make sala-versao`, `make sala-rollback SHA=` | P1 Infra | `/api/v1/health` devolve `0.0.1-SNAPSHOT`; não dá para saber qual commit está no ar nem voltar sem adivinhar | `pom.xml`/build com o commit, tag no git, `/health` com a versão, passo de rollback no runbook |
| 3 | ~~Desligamento gracioso e sessão persistente~~ **feito em 26/10 no código; falta publicar** | P2 Saúde | `server.shutdown=graceful` (25 s, abaixo do `stop_grace_period` de 30 s do compose) e `spring-session-jdbc` (Flyway V2). Verificado: reiniciar a API mantém o login. O primeiro deploy com isso desloga todos uma última vez | `application.properties`, `V2__spring_session.sql` |
| 4 | ~~CI no GitHub Actions~~ **feito em 26/10** (`.github/workflows/ci.yml`; verde) | P3/P4 | em todo push na `main` e em PR: `mvn test` num Postgres vazio (Flyway V1 e V2 do zero, `ddl-auto=validate`); no front, tipos gerados em dia com o `openapi.yaml`, typecheck, lint, 265 testes e build; stack completo com `smoke-p1` (100) e `test:e2e:real` (5). O CI não publica: o deploy continua sendo `make sala-deploy` | `.github/workflows/ci.yml` |
| 5 | ~~Restore dos uploads com arquivo real~~ **feito em 26/10 (local)** | P6 Backups | arquivo enviado, hash do banco e arquivo restaurado do tarball do volume são idênticos; em produção, `verificar-uploads.sh` (`hetzner-infra`, PR #7) confere o volume contra o banco | `hetzner-infra/rural-sala-de-aula/verificar-uploads.sh` |
| 6 | ~~Hash SHA-256 do arquivo~~ **feito em 26/10** (Flyway V3; conferido no download; visível ao professor na avaliação) | RNF02 | provar que a entrega não foi alterada | `EntregaService`, `V3__arquivo_hash_sha256.sql` |

O item 4 é o que dá mais retorno depois do 1: o Java só foi compilado de verdade em 19/10 e dois bugs só apareceram em produção.

## Em aberto (precisa de gente, não de código)

- **Confirmado com o Luiz (conversa direta, novembro/2026):** (a) o professor define só o prazo final (ADR-0006); (b) o aluno entrega individualmente atividade "Em grupo" até o RF06 entrar; (c) complexidade e modalidade ficam fora do escopo.
- **Tag `luiz/servicos-originais`** (aponta para `7ea7e79`, a pasta `servicos/` dele antes da consolidação em `classes/`): já publicada no GitHub, e o Luiz sabe que `servicos/` virou `classes/<domínio>/`. Do trabalho dele ainda valem `listarPorTurma`, `listarPorGrupo` (membros de turma e grupo) e `excluir` (usuário e turma), no padrão novo e com DTOs.
- **`hetzner-infra`:** o PR #2 (documentação do Rural em produção) foi mergeado em 20/10. Fica uma dúvida separada: o `POSTGRES_DBS` do `.env.example` ainda lista `umami_db`, que **não** está no `.env` real da VPS (se o Umami usa esse banco, ele está fora do backup; confirmar antes de mexer).

## Dados de demonstração

`scripts/seed-demo.py` cria pela API um conjunto de demonstração (2 professores, 6 alunos, 2 turmas, 8 atividades em todos os estados, entregas com PDF, notas, avisos e comentários com respostas). Contas `@demo.rural`; a senha vem de `DEMO_SENHA` e não fica no repositório. É idempotente (se a conta da professora entra, não faz nada). Apagar: `DOMINIO=demo.rural bash rural-sala-de-aula/limpar-testes.sh [--apply]` no `hetzner-infra`. O cadastro tem limite de 30 por hora por IP; o seed usa 8.

## Como retomar

```bash
# stack local (raiz do repositório)
docker compose up -d --build

# API: 120 verificações
python3 -I scripts/smoke-p1.py                      # padrão http://localhost:8081/api/v1

# interface com a API real (em front/)
npm run test:e2e:real

# front: testes, tipos, lint e build
cd front && npm test && npm run typecheck && npm run lint && npm run build
```

Publicar na VPS: `git -C /opt/rural-sala-de-aula pull --ff-only` e `make sala-up` a partir de `~/hetzner-infra` (ou só `make sala-deploy`); acesso pelo Tailscale (`narniano@100.67.163.103`). Rodar o smoke contra produção cria usuários `@teste.rural`; a limpeza é `rural-sala-de-aula/limpar-testes.sh` no `hetzner-infra` (mostra primeiro, apaga só com `--apply`). Runbook completo: `hetzner-infra/rural-sala-de-aula/README.md`.

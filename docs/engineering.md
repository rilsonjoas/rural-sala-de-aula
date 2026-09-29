# Alinhamento com o padrão de engenharia

Este projeto usa como referência o `PADRAO-DE-ENGENHARIA.md` do repositório `hetzner-infra`. A referência é o checklist P0–P9; este documento registra o que a Fase 0 já cumpre e o que continua pendente.

## Princípio de ciclo

A Fase 0 é “fazer funcionar”: cria o esqueleto executável, o contrato, o banco local e a fronteira entre as frentes. O checklist completo de endurecimento entra antes de declarar o serviço pronto para produção, principalmente depois que a Fase 1 entregar valor real.

## Política de testes: o mínimo que compensa

Decisão do autor (2026-09-29), com prazo apertado até a apresentação da 2ª VA.

**O critério não é "testar mais", é "testar o que roda".** O projeto não tem CI, então um teste que só executa quando alguém lembra de chamá-lo vale quase nada. Por isso o investimento é pequeno e fica onde já existe execução automática.

| Onde | Como está | Observação |
|---|---|---|
| Invariantes do schema | `scripts/check-invariantes.sh`, ligado no `verify.sh` | Sobe um Postgres efêmero, aplica a migration do zero e confere o que as triggers devem recusar. Roda em segundos e é a única rede de segurança das triggers — sem CI, uma `V2` pode derrubar um `CREATE TRIGGER` sem ninguém perceber. |
| Contrato e tipos | `npm run typecheck` no `verify.sh` | O `openapi.yaml` é a fronteira da dupla; o typecheck é o que pega contrato e front desalinhados. |
| Front (unidades e fluxos) | Vitest + Testing Library e Playwright, no `verify.sh` | Só escreve teste de componente que já tem comportamento definido. |
| API | JUnit + Mockito, no `verify.sh` via Maven | O slice test do `HealthController` é o padrão atual. |

**Fora do escopo, de propósito:**

- **Testcontainers** e suíte de integração contra banco real. A mesma informação que o `check-invariantes.sh` dá sai mais barata assim, e a dependência nova cairia na pior semana do cronograma.
- **Cobertura como métrica.** Não há meta de percentual. Um número de cobertura que não muda nenhuma decisão é só trabalho.
- **Teste de regra que ainda não está decidida.** A regra de XP por nota está bloqueada pela escala (ADR-0007); escrever teste antes de decidir a escala é escrever teste errado duas vezes.

**E o resto é manual, de propósito.** Para uma entrega que se apresenta, verificação manual feita com atenção vale mais que suíte ampla. O que não pode é perder o que o banco já garante: as invariantes estão em trigger justamente porque são o tipo de regra que o teste manual esquece.

## Estado por prioridade

| Item | Estado | Registro |
|---|---|---|
| P0 Segurança | Parcial | `.env` fora do Git, CORS restrito e auditoria de dependências frontend automatizada no verify; auth, rate limit e cookies httpOnly são da Fase 1 |
| P1 Infra e deploy | Parcial | Compose local e esqueleto de produção no `hetzner-infra`; primeiro deploy ainda não ocorreu |
| P2 Saúde e resiliência | Parcial | Actuator, health check com dependência do banco, shutdown gracioso e health checks dos containers |
| P3 CI/CD | Exceção consciente | Decisão do autor: sem GitHub Actions; testes rodam localmente e o deploy é manual |
| P4 Testes | Base pronta | JUnit na API, Vitest/Testing Library e Playwright no frontend; Mockito fica reservado para os testes de serviço da Fase 1 |
| P5 Monitoramento e logs | Pendente de produção | Logging rotacionado no compose; Uptime Kuma, Sentry e alertas serão configurados no deploy |
| P6 Backups e recuperação | Planejado | `rota_de_estudo_db` e `.env` entram no backup do `hetzner-infra`; falta executar e testar no VPS |
| P7 UI/UX e acessibilidade | Base pronta | Shell mobile-first, foco visível, dicionário i18n e tokens shadcn; telas reais entram na Fase 1. A interface do MVP é em português; o catálogo `en` é da Fase 4 (ADR-0003) e o esqueleto PWA é da Fase 2 (ADR-0006) |
| P8 Funcionalidades | Próxima fase | Auth, períodos, disciplinas, tarefas, provas e horários |
| P9 Documentação | Em andamento | Contrato, ADRs, runbook de produção e este registro |

## Decisões que não podem ser esquecidas

- O PostgreSQL de produção é o `postgres-shared` do Hetzner, com banco lógico e role isolados; o Compose local não é o banco de produção.
- Uma VPS única e um container Postgres não são alta disponibilidade. A disponibilidade operacional vem de `restart`, health checks, backup, monitoramento e, no limite, réplica/managed DB.
- shadcn/ui é a base de componentes; a Rota não herda o Design Narniano por ser uma ferramenta de dados, não um produto de contemplação.
- O contrato OpenAPI é a fronteira da dupla. Qualquer mudança incompatível precisa atualizar `docs/openapi.yaml`, regenerar tipos e ser comunicada antes da implementação.
- O fuso do usuário é parte do domínio; nada de “hoje” fixo em UTC no backend.
- O service worker, o manifest e o web push são todos da Fase 2 (ADR-0006). Nada no MVP promete instalação. Push exige HTTPS e, no iOS, exige o app na tela de início.
- Nenhuma string de interface pode ser escrita direto no JSX, mesmo com o MVP em português: o dicionário é o que mantém o inglês futuro barato (ADR-0003). O idioma em si não é prioridade agora — `VITE_LOCALE` fica em `pt-BR`.

## Pendências de produção

- Provisionar `rota_de-estudo_db` e `rota_app` na VPS.
- Guardar o `.env` real no Bitwarden e colocá-lo em `ENV_FILES`.
- Publicar os dois subdomínios, configurar TLS e Uptime Kuma.
- Rodar a migration Flyway em ambiente limpo e testar rollback de aplicação.
- Fazer um backup e um restore test antes de habilitar o monitor como operação confiável.
- Revisar P0, P2, P5 e P6 antes do lançamento.

## Evidência de verificação

`bash scripts/verify.sh` executa o preflight, a verificação das invariantes do schema, typecheck, lint, auditoria de dependências, testes unitários, build, E2E e testes Maven. O comando pressupõe Docker, Node e o navegador do Playwright instalados. `SKIP_DB=1` pula a verificação do schema quando não há Docker; `SKIP_E2E=1` pula o Playwright.

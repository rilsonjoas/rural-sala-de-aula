# Rota de Estudo (StudyPath)

Agenda acadêmica **web-first** para organizar o semestre do estudante: horários de aula, prazos de entrega, datas de prova, calendário com colisões, notificações (web push) e uma gamificação leve de recompensas. É **PWA, não app nativo** — o aviso é entregue pelo sistema operacional a partir do PWA, e **nenhuma fase do roadmap publica app em loja** (ver *Não existe app nativo*).

> **Dupla:** Rilson Joás + Luiz · **Nome internacional:** StudyPath (guardado para o mercado em inglês; **o MVP entrega em português** — ver ADR-0003)

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + Tailwind + shadcn/ui + PWA | app autenticado (SEO irrelevante), push via service worker, sem conflito SSR/auth (ADR-0002) |
| **Backend** | Spring Boot (Java 21) + JPA + Flyway; Spring Security na Fase 1 | 2ª língua de mercado do autor; caso real de Web/Java para portfólio (ADR-0001) |
| **Banco** | PostgreSQL | padrão consolidado do autor |
| **Infra** | Docker Compose · VPS Hetzner · Traefik · Sentry · Uptime Kuma | self-host, observabilidade |

## Roadmap

- [x] **Fase 0 — Setup:** monorepo; Contrato de API desenhado; Postgres via Compose; testes locais (Vitest/Playwright no front, JUnit/Mockito no api).
- [ ] **Fase 1 — Core:** `usuario` + auth por e-mail/senha (cookie httpOnly, refresh rotativo); `periodo` (aberto/arquivado pelo aluno); `disciplina`; CRUD `tarefa`/`prova`; grade-tipo semanal + cancelamento por instância; telas **Hoje / Semana** (mobile-first); **gamificação mínima** (XP, nível e sequência de dias — ADR-0008).
- [ ] **Fase 2 — Push:** VAPID web push; job cron no Spring (tarefa 24h antes; prova em cascata 7-3-1); antecedências fixas lidas de `config_notificacao`; cancelamento silencia o lembrete; login com Google (RF13), depois de entrar no contrato OpenAPI. **Depende do esqueleto PWA, que também foi adiado** (ADR-0006). Sem tela de preferências (RF12 adiado). Continua P3 (RF07).
- [ ] **Fase 3 — Gamificação:** módulo desacoplado (eventos de domínio → XP/nível/streak/conquistas); só recompensa no V1, punição como ponto de extensão.
- [ ] **Fase 4 — Profissionalizar:** checklist de engenharia (P0–P9), Sentry, acessibilidade, i18n EN, deploy Traefik, monitoramento e docs.

> A cada fase: testes primeiro, convenções do padrão de engenharia, validação com o parceiro.
>
> **Idioma:** Fases 1 a 3 entregam a interface **em português**; o catálogo em inglês e a troca de idioma entram na Fase 4 (ADR-0003). O dicionário de chaves já existe desde o primeiro commit — o que está adiado é só a tradução.

## O que é o MVP (apresentação na 2ª VA, 16/11)

A apresentação para a professora é em **16/11**, e o primeiro deploy está marcado para 30/11. Tudo o que está na Fase 2 em diante acontece **depois** da apresentação — não disputa prazo com o MVP, é a fase seguinte.

**Entra no MVP (Fase 1, ~7 semanas, dupla com um dos dois aprendendo Java/Spring):**

**São 9.** Em ordem de construção:

| # | RF | O que o aluno faz |
|---|---|---|
| 1 | RF01 | Criar conta com e-mail e senha e entrar |
| 2 | RF02 | Abrir o semestre e cadastrar as matérias |
| 3 | RF03 | Lançar tarefa com prazo e marcar como concluída |
| 4 | RF10 | Ver o painel **Hoje**: o que vence hoje e nos próximos dias, com contagem das provas |
| 5 | RF08 | Ganhar pontos, subir de nível e manter a sequência de dias |
| 6 | RF04 | Registrar a data das provas |
| 7 | RF05 | Montar a grade semanal de aulas |
| 8 | RF06 | **Cancelar a aula de um dia**, com motivo e opção de desfazer |
| 9 | RF11 | Ver a grade da semana |

Em uma frase, o que se promete à professora: **um app web onde o semestre inteiro fica organizado — o que vence, as aulas de cada semana, e quanto se estudou.**

**Fica de fora do MVP:**

- **RF09 (colisões).** Zero domínio, zero schema, zero contrato — é realce visual. Pior: a §6.4 da pauta registra que não existe endpoint de colisão e que o botão "Reorganizar plano de estudo" não tem comportamento definido. É o item mais caro de verificar e o que menos aparece em demonstração.
- **Visão Mês.** A `DESIGN.md` §6.1 já propõe trocar Mês por Disciplinas, e essa decisão está aberta (§6.1 da pauta). Construir uma tela que talvez seja jogada fora é o pior uso das 7 semanas.
- **Esqueleto PWA (manifest + service worker).** Adiado para a Fase 2, junto com o push (ADR-0006). Não é exigida por nenhuma entrega mínima: o deploy da 2ª VA funciona sem service worker, e o RNF01 passou a verificar apenas a operabilidade em 360px. Sem ele, nenhuma notificação funciona — mas nenhuma notificação é entrega da 2ª VA.
- **Pós-apresentação (Fase 2+):** RF07 (Web Push), RF09 (colisões), RF12 (preferências, adiado), RF13 (Google). Conquistas, cálculo de média e nota por prova também são dessa fase.

**A gamificação NÃO está nessa lista de fora:** ela entra no MVP em nível mínimo — XP, nível e sequência de dias, derivados de `tarefa`, sem tabela nova (ADR-0008) — porque a professora pede na 2ª VA.

### Ordem de corte se o prazo apertar

Sete semanas para nove requisitos, com a API ainda só no esqueleto (Fase 0 tem apenas o health check) e um dos dois aprendendo Spring. **Não há folga.** A lista abaixo é o combinado prévio: se faltar tempo, o corte é por ordem, não na hora e por pânico.

| Ordem | O que sai | Por que é o primeiro | O que sobra |
|---|---|---|---|
| **1º** | **RF11 — a tela da Semana vira um bloco dentro do Hoje** | É uma tela inteira, mas o dado já existe. A grade continua visível, muda só o lugar. | O aluno vê as aulas da semana no painel Hoje |
| **2º** | **RF04 — registro de provas** | Aí o Hoje perde a contagem regressiva de prova. Dói, mas o resto da agenda continua inteiro. | O Hoje mostra só tarefas e aulas |
| **3º** | **RF08 — a gamificação** | Só se a professora abrir mão. Cortar o que ela pediu é último recurso, e precisa ser dito a ela, não escondido. | App sem pontos, nível e sequência |
| **Nunca** | **RF06 — cancelar aula** | É a resposta para "o que tem aqui que o Todoist não tem?", e é o mais barato: a tabela, as duas triggers e a `UNIQUE` já existem. Falta só o endpoint e a modal. | — |

**Regra de bolso:** cada corte tira uma tela, nunca uma regra de negócio. Os invariantes do banco (`cancelamento`, `tarefa`, `antecedências`) ficam de pé em qualquer cenário de corte — estão em trigger, não na interface (ADR-0006, `CONTEXT.md`).

**O que se diz ao cortar:** a professora precisa saber o que foi decisão e o que foi prazo. "A grade está aqui dentro do Hoje em vez de numa aba separada" é escopo. "Não deu tempo" é honesto. Esconder é o que destrói a confiança na próxima apresentação.

### Lembretes no MVP: o que dá e o que não dá

A informação do lembrete é a mesma que RF10 e RF04 já entregam — push é **transporte**, não conteúdo. O que muda é se o aviso chega com o app fechado.

| Transporte | Custo | Chega com o app fechado? | MVP |
|---|---|---|---|
| Painel Hoje com contagem (RF10) | já no escopo | — | **sim, de graça** |
| Banner ao abrir o app | baixo | não | **sim** |
| `Notification` local via service worker | meio dia | não | exige HTTPS |
| **Web Push VAPID (RF07)** | Fase 2 inteira | **sim** | **não** |

O push real não cabe antes de 16/11 por três motivos: **exige HTTPS** (só há localhost, e o deploy é de 30/11); **a parte cara é backend** — VAPID, tabela de subscriptions, endpoint, cron, cascata 7-3-1, fuso e a regra de cancelamento silenciando; e **uma notificação que dispara enquanto o app está aberto não prova nada que a contagem regressiva não prove**. O que provaria é o aviso chegando com o app fechado, que depende do deploy.

⚠️ **O que a demonstração não vai mostrar:** lembrete chegando com o app fechado. Isso é honesto com a professora e evita vender o que não existe. Se sobrar tempo depois do núcleo, o `Notification` local via service worker é o degrau seguinte — mas ainda precisa de HTTPS, ou seja, de um deploy.

### Não existe app nativo — o aviso vem do PWA

O Rotificador é **Web Push**, não aplicativo. **Nada do V1 é publicado em Play Store ou App Store**, e nenhuma etapa do roadmap prevê isso: o aluno acessa pelo navegador, pode adicionar à tela de início e o aviso é entregue pelo próprio sistema operacional (ADR-0006).

No iPhone o aviso aparece na Central de Notificações e na tela de bloqueio **igual a um app nativo** — mas o app não existe. E há uma pegadinha que parece bug: **no iOS o push só funciona com o PWA adicionado à tela de início** (Safari → Compartilhar → Adicionar à Tela de Início). Como aba do Safari, não chega nada. Se o aluno reclamar que "no iPhone não avisa", a causa quase sempre é essa.

| Onde | Como chega | Precisa instalar antes? |
|---|---|---|
| Android (Chrome) | notificação do sistema | opcional; sem instalar, só chega com o app aberto |
| Desktop (Chrome, Edge, Firefox) | notificação do sistema | não |
| **iOS (Safari)** | Central de Notificações e tela de bloqueio | **sim** — tem que estar na tela de início |

### Risco de prazo

O primeiro deploy está em 30/11, **depois** da apresentação. Então a demo em 16/11 roda local, sem plano B se a máquina da sala falhar. Um deploy mínimo antes da 2ª VA (Traefik + Docker já está esqueleto no `hetzner-infra`) custa pouco e compra o ajeito.

## Estado da Fase 0

- Contrato de integração em [`docs/openapi.yaml`](docs/openapi.yaml), com as convenções resumidas em [`docs/api.md`](docs/api.md) e tipos gerados em `front/src/lib/api.generated.ts`.
- API Spring Boot 21 com Actuator, Flyway, JPA, PostgreSQL, migration inicial do domínio e health check em `GET /api/v1/health`.
- Front Vite + React + TypeScript com shell mobile-first, rotas Hoje/Semana/Mês, dicionário de chaves com **português ativo** (inglês fica para a Fase 4, ADR-0003), base shadcn/ui e conexão com a API.
- Docker Compose com `db`, `rota-estudo-api` e `rota-estudo-front`; Nginx faz o proxy de `/api` no serviço do frontend.
- Esqueleto de produção documentado no repositório `hetzner-infra`; o banco final será o `rota_de_estudo_db` no Postgres compartilhado da VPS.
- CRUD, autenticação, push, gamificação e PWA continuam nas fases seguintes.

## Desenvolvimento local

```bash
cp .env.example .env
cp front/.env.example front/.env.local
docker compose up --build
```

A API fica em `http://localhost:8080`, o frontend em `http://localhost:8081`, o Swagger em `http://localhost:8080/swagger-ui.html` e o PostgreSQL em `localhost:5432`. Se alguma porta já estiver ocupada, altere `API_PORT`, `FRONT_PORT` ou `DB_PORT` no `.env` antes de iniciar.

Para o frontend em modo iterativo:

```bash
cd front
npm install
npm run dev
```

Os testes da API e do frontend são executados localmente; o Playwright exige os navegadores do Playwright instalados no ambiente.

Para validar a base inteira:

```bash
bash scripts/preflight.sh
bash scripts/verify.sh
```

## Documentação e operação

- [`docs/engineering.md`](docs/engineering.md) — alinhamento com P0–P9 e lacunas de produção.
- [`docs/pre-meeting.md`](docs/pre-meeting.md) — o que já está pronto e o que a reunião precisa decidir.
- [`docs/reuniao-luiz.md`](docs/reuniao-luiz.md) — briefing curto para apresentar o projeto ao parceiro.
- [`docs/DESIGN.md`](docs/DESIGN.md) — shadcn/ui, tokens e decisão de não herança do Design Narniano.
- [`hetzner-infra/rota-de-estudo/README.md`](../hetzner-infra/rota-de-estudo/README.md) — topologia de produção, provisionamento e ordem de deploy.
- [`docs/adr/0005-shared-postgres.md`](docs/adr/0005-shared-postgres.md) — decisão do banco compartilhado e seus limites.

## Decisões de arquitetura

Registradas como ADRs em [`docs/adr/`](docs/adr/):

| ADR | Decisão | Motivo central |
|---|---|---|
| [ADR-0001](docs/adr/0001-backend-spring-boot.md) | Backend em **Spring Boot** (não Fastify/TS nem Laravel) | dominar Java/mercado enterprise; Laravel já dominada no Assídua |
| [ADR-0002](docs/adr/0002-frontend-vite-react.md) | Frontend em **Vite + React** (não Next.js) | app autenticado, PWA + push; SEO fora de escopo |
| [ADR-0003](docs/adr/0003-internacionalizacao.md) | **i18n desde o V1**; nome duplo Rota de Estudo/StudyPath | porta do inglês aberta, zero texto hardcoded; **interface do MVP em português** (complemento 2026-09-29) |
| [ADR-0004](docs/adr/0004-shadcn-visual-direction.md) | shadcn/ui como base de componentes, sem herança do Design Narniano | ferramenta de dados precisa de clareza, não ornamento devocional |
| [ADR-0005](docs/adr/0005-shared-postgres.md) | PostgreSQL compartilhado na VPS Hetzner | economiza RAM; exige backup, monitoramento e limite explícito de disponibilidade |
| [ADR-0006](docs/adr/0006-pwa-shell-vs-push.md) | **Esqueleto PWA e push adiados para a Fase 2** | push é a parte cara (tudo Spring); o esqueleto perdeu prioridade para a gamificação do MVP. No iOS, push só funciona com o app na tela de início |
| [ADR-0007](docs/adr/0007-peso-e-nota-fora-do-mvp.md) | `prova` no MVP = título + data; **peso e nota adiados** | `peso` era obrigatório e nada lia; a escala da nota está em conflito (0–100 no banco, "≥ 7" na regra) |
| [ADR-0008](docs/adr/0008-gamificacao-minima.md) | **Gamificação mínima no MVP:** XP fixo de 20, nível e sequência de dias, derivados de `tarefa` | a professora pede gamificação para a 2ª VA; sem tabela nova, e `tipo`/`prioridade` saem do formulário |

## Domínio (glossário)

Ver [`CONTEXT.md`](CONTEXT.md). Eixos: `usuario` (dono dos dados, contas 100% individuais) → `periodo` (topo, manual) → `disciplina` (central) → `tarefa` (**no MVP: título, prazo e concluída**) · `prova` (**no MVP: data e título**) · `horario` (grade-tipo) · `cancelamento` (exceção por instância) · `config_notificacao` (antecedências **fixas**) · gamificação (**derivada de `tarefa`, sem tabela própria**).

## Estrutura

```
rota-de-estudo/
├── api/            # Spring Boot (REST + auth + jobs push)
├── front/          # Vite + React + shadcn/ui (PWA)
├── docs/adr/       # decisões de arquitetura
├── docs/api.md     # contrato de API (Fase 0)
├── docs/engineering.md # alinhamento com P0–P9
├── docs/reuniao-luiz.md # briefing da reunião
├── scripts/        # preflight e verificação
├── CONTEXT.md      # glossário do domínio
└── docker-compose.yml
```

## Modelo Cebola (Mapeamento de Stakeholders)

```mermaid
flowchart TD
    subgraph L4["4. Ambiente Amplo (Privacidade LGPD, W3C Web Push & Concorrência)"]
        subgraph L3["3. Sistema Abrangedor (Dupla de Devs, Universidades & Monetização)"]
            subgraph L2["2. O Sistema (Operadores & Estudantes)"]
                subgraph L1["1. O Produto (The Kit)"]
                    P["React + Vite + PWA + shadcn/ui<br>+ Spring Boot (Java 21) + PostgreSQL + Traefik"]
                end
                U["Estudantes (UFRPE e outras) · Autores (Rilson + Luiz como usuários)"]
            end
            S["Dupla de Co-desenvolvimento (Rilson & Luiz) · Grupos de Estudo · StudyPath PRO"]
        end
        R["⚠️ LGPD (Dados de estudantes/auth Google) · VAPID/Web Push Standards · Concorrentes (Notion/Todoist)"]
    end

    style L1 fill:#1e3a8a,color:#fff
    style L2 fill:#064e3b,color:#fff
    style L3 fill:#78350f,color:#fff
    style L4 fill:#7f1d1d,color:#fff
```

* **1. O Produto (*The Kit*):** Frontend Vite + React + shadcn/ui (PWA), backend enterprise em Spring Boot com Spring Security e Flyway, banco PostgreSQL e proxy Traefik na Hetzner.
* **2. O Sistema (*Our System*):** Estudantes universitários organizando semestres caóticos (prazos de entrega, datas de provas, cancelamentos de aula e gamificação por XP/streak) e os autores operando o app no dia a dia.
* **3. O Sistema Abrangedor (*The Containing System*):** A parceria da dupla (Rilson e Luiz compartilhando o projeto no portfólio profissional), grupos acadêmicos que compartilham grades e potenciais planos premium no modelo internacional (*StudyPath*).
* **4. O Ambiente Amplo (*The Wider Environment*):** **LGPD e Privacidade** (armazenamento seguro de e-mails, autenticação OAuth Google), padrões de **Web Push/VAPID** dos navegadores (Chrome, Safari, Firefox) e registro de marca nas lojas (*Rota de Estudo* / *StudyPath*).

## Requisitos do Sistema

Conforme as boas práticas de Engenharia de Software: **Requisitos Funcionais (RF)** expressam comportamento observável (*O Verbo*), enquanto **Requisitos Não-Funcionais (RNF)** expressam qualidades e restrições arquiteturais (*O Advérbio* / ISO 25010).

### Requisitos Funcionais (RF — O Verbo)

Priorizados por dependência e relevância: **P1** é a fatia vertical que já resolve o problema de ponta a ponta; **P2** completa a agenda; **P3** depende de dados reais ou de integração externa. RF10–RF13 detalham itens que antes estavam agrupados em RF01 e RF09.

| Prior. | RF | Requisito | Depende de |
|---|---|---|---|
| P1 | RF01 | **Autenticar** o usuário com e-mail e senha (cadastro, login, logout; cookie httpOnly com refresh rotativo). | — |
| P1 | RF02 | **Cadastrar e gerenciar** períodos acadêmicos (semestres) e disciplinas. | RF01 |
| P1 | RF03 | **Lançar e concluir** tarefas. No MVP o formulário é **só título, prazo e concluída** — `tipo`, `prioridade`, descrição e tags ficam no schema, opcionais, sem tela (ADR-0008). | RF02 |
| P1 | RF08 | **Pontuar** XP, calcular nível e manter a **sequência de dias consecutivos com tarefa concluída**. **Entra no MVP** por exigência da professora: XP fixo de 20 por tarefa, derivado de `tarefa`, sem tabela nova (ADR-0008). | RF03 |
| P1 | RF10 | **Exibir** o painel Hoje: o que vence hoje e nos próximos dias, provas com contagem e progresso. | RF03 |
| P2 | RF04 | **Registrar** data e título de provas. `peso` e `nota` saem do MVP (ADR-0007). | RF02 |
| P2 | RF05 | **Configurar** grade semanal de aulas (dia da semana e horário fixo). | RF02 |
| P2 | RF06 | **Registrar cancelamento** de aula pontual (com motivo opcional) e desfazê-lo. | RF05 |
| P2 | RF11 | **Exibir** as visões Semana (grade de horários) e Mês, com a semana começando na segunda. | RF04, RF05 |
| P3 | RF07 | **Disparar** lembretes Web Push (VAPID) 24h antes de tarefas e em cascata (7-3-1 dias) para provas. | RF03, RF04, RF06 |
| P3 | RF09 | **Destacar** colisões de horários e prazos. (depois da apresentação) | RF11 |
| P3 | RF12 | **Configurar** preferências de notificação por tipo de evento. (adiado) No MVP as antecedências são fixas (`CONTEXT.md`). Volta quando o push existir e houver demanda real; ao voltar, reabre o contrato OpenAPI. | RF07 |
| P3 | RF13 | **Autenticar** com conta Google (OAuth) como alternativa ao e-mail/senha. *Ainda fora do contrato OpenAPI.* | RF01 |

**Ordem de implementação:** RF01 → RF02 → RF03 → RF10 → RF08 → RF04 → RF05 → RF06 → RF11 → RF07 → RF13. RF09 (colisões) e RF12 (preferências) ficam de fora do MVP.

> **Lembretes e PWA (ADR-0006):** o push é P3 e é a funcionalidade mais pesada em backend do contrato (VAPID, job cron, tabela de subscriptions, preferências, cascata 7-3-1). Nem o push nem o esqueleto instalável (manifest + service worker) entram no MVP — os dois são da Fase 2, e o RNF01 não promete instalação até lá.

### Requisitos Não-Funcionais (RNF — O Advérbio)

**Dois, e só os que dão para verificar antes da 2ª VA.** A professora pediu para reduzir o que se promete. O critério de corte foi simples: se não dá para testar até 16/11, não entra como promessa — vira regra interna de construção (seção seguinte).

| RNF | Requisito | Critério | Como verificar |
|---|---|---|---|
| RNF01 | *Usabilidade / Táctil e Responsivamente* | Interface **mobile-first**, 100% operável por toque em telas de 360px a 2560px sem exigir hover, com feedback visual imediato. | Teste E2E no Playwright com viewport de 360px, só por toque. |
| RNF02 | *Segurança / Seguramente* | **Os dados de um aluno nunca aparecem para outro** — autorização por dono em todas as rotas, sessão em cookie httpOnly e zero credencial em localStorage. | Teste de API: recurso de outra conta responde `404`. |

### Regras internas de qualidade (não são promessas para a 2ª VA)

O que foi retirado da tabela acima continua valendo como regra de construção — só não é mais COMPROMISSO com a professora, porque não dá para verificar na prazo. Fica registrado aqui para não ser esquecido:

| Regra | Por que saiu da promessa |
|---|---|
| **Disponibilidade** — restart automático, health checks, backup com restauração testada | 99,5% ao mês é meta de **produção**, e o app nunca rodou em produção. O método de verificação era um relatório mensal do Uptime Kuma, que só existe depois do deploy de 30/11. Prometer um número que a gente não tem como medir é o que a professora pediu para não fazer. |
| **Português no MVP** | Não é requisito de qualidade, é fato: a interface está em português. Fica a disciplina do dicionário de chaves (ADR-0003). |
| **Fuso por usuário** | É regra de implementação, não promessa. Continua obrigatória porque a sequência de dias e a cascata de lembretes dependem dela (ADR-0006, `CONTEXT.md`). |
| **Refresh rotativo, rate limit no login** | Boa prática de segurança, mas não verificável por uma professora em 30 minutos de apresentação. Vira critério do RF01 (autenticação), não promessa de RNF. |

### Histórias de Usuário (candidatas)

- **HU01 · Painel Hoje (P1: RF03, RF10)** — *Como estudante, quero ver numa só tela o que vence hoje e nos próximos dias, para decidir o que fazer primeiro.* Aceite: mostra as tarefas pendentes do período ativo, da mais próxima para a mais distante; concluir uma tarefa tira ela da lista na hora; funciona em tela de 360px só com toque.
- **HU02 · Cancelar aula (P2: RF06)** — *Como estudante, quero marcar que a aula de amanhã foi cancelada, para não ir à toa nem ser lembrado dela.* Aceite: a aula some daquela data e continua nas outras semanas; não é possível cancelar duas vezes a mesma aula na mesma data; desfazer traz a aula de volta.
- **HU03 · Lembrete de prova (P3: RF07)** — *Como estudante, quero ser avisado 7, 3 e 1 dia antes de cada prova, para começar a estudar a tempo.* Aceite: três avisos por prova no fuso do usuário; nenhum aviso repetido para o mesmo evento; dá para desligar os avisos de prova nas preferências.

### Plano de Entregas (proposta da dupla)

Datas do cronograma de Engenharia de Software 2026.2; o escopo de cada marco é revisado a cada status report.

| Data | Marco | Escopo proposto |
|---|---|---|
| 25/09 | Fase 0 (concluída) | Contrato OpenAPI, tipos gerados, migration V1, esqueleto do front e da API, Compose local. |
| 19/10 | Status Report 2 | Protótipo visual e 2 histórias implementadas: RF01–RF03 e painel Hoje (RF10). |
| 28/10 | Status Report 3 | Lições aprendidas e ações corretivas; P2 em andamento (provas e grade). |
| 16/11 | 2ª VA — **apresentação** | Agenda completa: cancelamento (RF06), grade (RF05), visão Semana (RF11). **Sem** Mês, **sem** colisões, **sem** push. Ver *O que é o MVP*. |
| 30/11 | 3ª VA | Web Push (RF07), gamificação (RF08) e primeiro deploy na VPS. |

Documento de visão e slides da disciplina: `Rota de Estudo - Documento de Visão.docx` e `Rota de Estudo - Requisitos e Escopo.pptx`, na raiz do repositório.

## Definição de Pronto (Definition of Done - DoD)

Para que uma funcionalidade / história de usuário seja considerada formalmente **"Pronta"** e apta para homologação e apresentação de Status Report, ela deve atender aos 3 critérios centrais:

1. 🎯 **Critérios de Aceite Atendidos:** A funcionalidade cumpre o fluxo de negócio esperado da história de usuário (os dados são persistidos e recuperados corretamente sem quebras).
2. 📱 **Interface Responsiva (Mobile-First):** A interface é 100% operável por toque no celular (a partir de 360px) e no computador, sem quebras de layout ou elementos sobrepostos.
3. 🐳 **Execução Integrada:** A funcionalidade roda de ponta a ponta no ambiente local via Docker Compose (`docker compose up --build`), com frontend, backend e banco de dados comunicando perfeitamente.

## 🎭 Casos de Uso (Use Cases — UML & Especificação)

Conforme os fundamentos de [[Diagramas UML]] e [[Análise de requisitos]], mapeamos a interação dos atores da Camada 2 (Estudante) e Camada 4 (Provedores Externos):

### 1. Diagrama de Casos de Uso (Mermaid)

```mermaid
flowchart LR
    E["👤 Estudante / Aluno"]
    G["🔐 Google OAuth (Auth Externa)"]
    W["🔔 Serviço Web Push (VAPID / Browser)"]

    subgraph SYS["📦 Rota de Estudo (StudyPath)"]
        UC1["⬮ UC01: Autenticar Usuário"]
        UC2["⬮ UC02: Gerenciar Semestre e Disciplinas"]
        UC3["⬮ UC03: Lançar Tarefas e Provas"]
        UC4["⬮ UC04: Montar Grade Semanal de Aulas"]
        UC5["⬮ UC05: Registrar Cancelamento de Aula"]
        UC6["⬮ UC06: Visualizar Painel 'Hoje' e Prazos"]
        UC7["⬮ UC07: Computar XP e Manter Streak"]
        UC8["⬮ UC08: Agendar e Disparar Lembrete Push"]
    end

    E --> UC1
    E --> UC2
    E --> UC3
    E --> UC4
    E --> UC6

    UC1 --> G
    UC7 -.->|<<extend>>| UC3
    UC5 -.->|<<extend>>| UC4
    UC8 --> W
    UC3 -.->|<<include>>| UC8

    style SYS fill:#fdf5e6,stroke:#83675e,color:#000
    style UC1 fill:#3e2723,color:#fff
    style UC2 fill:#3e2723,color:#fff
    style UC3 fill:#3e2723,color:#fff
    style UC4 fill:#3e2723,color:#fff
    style UC5 fill:#b49a60,color:#000
    style UC6 fill:#3e2723,color:#fff
    style UC7 fill:#1e3a8a,color:#fff
    style UC8 fill:#78350f,color:#fff
```

### 2. Especificação Textual do Caso de Uso Diferencial (UC05)

| Campo | Descrição |
| :--- | :--- |
| **Identificador & Nome** | **UC05 — Registrar Cancelamento de Aula Pontual** |
| **Ator Primário** | Estudante / Aluno |
| **Objetivo / Meta** | Registrar que uma aula específica da grade fixa não ocorrerá em determinada data, silenciando os alarmes e limpando o calendário daquele dia. |
| **Pré-condições** | O estudante deve possuir a disciplina e o horário cadastrados na grade semanal (`UC04`). |
| **Pós-condições** | O cancelamento é persistido na tabela `cancelamento`, a aula é ocultada da tela "Hoje/Semana" naquela data e a fila de Web Push descarta o lembrete programado. |
| **Gatilho (*Trigger*)** | O usuário toca no card da aula no calendário e seleciona a opção "Cancelar Aula Hoje / Nesta Data". |

#### Fluxo Principal (Caminho Feliz):
1. O estudante visualiza a aula na grade da semana ou no painel "Hoje" e aciona o botão de **"Registrar Cancelamento"**.
2. O sistema abre uma modal táctil solicitando a confirmação da data e um motivo opcional (ex.: *"Professor em congresso"*, *"Feriado local"*).
3. O estudante confirma o cancelamento.
4. O frontend envia a requisição `POST /api/v1/horarios/{horarioId}/cancelamentos` com a data (`date`) e o motivo opcional (`reason`), conforme o contrato OpenAPI.
5. O backend Spring Boot valida a propriedade do registro (*owner authorization*) e insere o registro na tabela `cancelamento`; a restrição única `(horario_id, data_cancelamento)` impede cancelar duas vezes a mesma aula na mesma data. O job de lembretes passa a ignorar aquela aula naquela data.
6. A interface re-renderiza o calendário instantaneamente com badge de "Aula Cancelada" (ou oculta a aula da lista de tarefas urgentes de hoje).

#### Fluxos Alternativos & Exceções:
* **FA01 — Desfazer Cancelamento (Restauração):** Caso o professor volte atrás, o aluno pode clicar no histórico de cancelamentos da disciplina e clicar em "Restaurar Aula". O frontend chama `DELETE /api/v1/cancelamentos/{cancelamentoId}`; o registro é removido e o lembrete volta a ser agendado se ainda houver tempo hábil.
* **FE01 — Cancelamento em Data Passada:** Se o aluno tentar registrar cancelamento para uma data anterior ao dia corrente, o sistema rejeita a operação com mensagem informativa ("Apenas aulas futuras podem ter cancelamento agendado"). *Pendente: regra ainda não descrita no contrato OpenAPI (ver `docs/api.md`).*
* **FE02 — Horário de Outra Conta:** Se o `horarioId` não pertencer ao usuário, a API responde `404` sem revelar se o recurso existe.

---

## Links

- Plano e histórico do grill: nota **[[Rota de Estudo]]** no vault (Obsidian).
- Padrões de engenharia e infra: repo `hetzner-infra` (`PADRAO-DE-ENGENHARIA.md`).
# Pauta — Reunião 01 (Rota de Estudo / StudyPath)

- **Quando:** próxima reunião da dupla (Rilson + Luís)
- **Objetivo:** destravar as pendências que travaram o início do projeto — divisão de trabalho e contrato de API — e alinhar decisões já fechadas.

---

## 1. Divisão de trabalho (bloqueante — decidir AQUI)

**Decisão que destrava tudo o resto. Sem ela, ninguém sabe o que montar.**

- [ ] Quem assume o **frontend** (`front/`: Vite + React + TypeScript + shadcn/ui)?
- [ ] Quem assume a **API** (`api/`: Spring Boot + Java)?
- [ ] Critério: nível real de cada um em **Java/Spring** vs **React/TS** — ser honesto, não é hierarquia, é divisão de aprendizado.
- [ ] **Review do outro:** revisa toda PR/merge ou por fase? Regra simples acordada vale mais que pipeline formal.
- [ ] **E-mail do Luís** para convite como collaborator no repo `rilsonjoas/rota-de-estudo`.

> Plano de carreira do Rilson: dominar Java/Spring é o objetivo central deste projeto (2ª língua de mercado). Nada de "quem é melhor" — se os dois quiserem Java, resolve-se na divisão das telas.

## 2. Contrato de API (`docs/api.md`) — fronteira da dupla

- [ ] Quem escreve a primeira versão? (sugestão: o dono da `api/` desenha; o dono do `front/` valida)
- [ ] Formato de acerto: **OpenAPI** (springdoc) ou markdown simples primeiro? Decidir um.
- [ ] Cobertura mínima da Fase 0: `usuario`/auth + `periodo` + `disciplina` + `tarefa` + `prova` + `horario` + `cancelamento`.
- [ ] Padrões: paginação, erros, timezone — definir no próprio contrato.

## 3. Validação das decisões de arquitetura (já fechadas)

> Arquitetura **não está em discussão** nesta reunião — são ADRs registradas no repo. Aqui só valida-se que o Luís está confortável e alinhado.

- [ ] **Backend Spring Boot** (ADR-0001) e **front Vite+React** (ADR-0002) — ok? Alguma preocupação real?
- [ ] **Sem CI/CD neste projeto** (decisão do autor, 2026-09-24): testes rodam **local** (Vitest/Playwright no front, JUnit/Mockito no api), deploy **manual** via Traefik na VPS. Importante o Luís saber pra não esperar pipeline de PR.
- [ ] **Nome** Rota de Estudo / StudyPath (ADR-0003): a **interface do MVP é em português** — o dicionário de chaves já existe desde o primeiro commit, então a porta do inglês fica aberta sem custo, mas o catálogo `en` e a troca de idioma são da Fase 4. Zero texto hardcoded continua valendo. **Ok?**
- [ ] **Deploy:** self-host VPS Hetzner (Traefik + Docker) — domínio sugerido `rota-de-estudo.narniano.com`. Quem administra? (hoje: Rilson).

## 4. Gamificação — já decidida, falta só validar com o Luís

> A tabela v0 antiga (`10 × prioridade`, `50` para trabalho, "XP dobrado") foi **descartada**: eram três regras conflitantes para a mesma pergunta, e `prioridade` e `tipo` saíram do formulário. A decisão está na [ADR-0008](./adr/0008-gamificacao-minima.md).

- [ ] **Validar a fórmula** (duas linhas, sem tabela nova):

  ```
  nível  = (tarefas concluídas ÷ 3) + 1
  pontos = (20 × tarefas) + (50 × (nível − 1))
  ```

  - 20 pontos por tarefa concluída · nível a cada 3 tarefas · 50 de bônus ao subir
  - Calibrado para **2 a 3 tarefas por semana** (a tabela antiga chutava 15 e travava no nível 3)
  - O nível vem das **tarefas**, nunca dos pontos — é o que evita a equação circular e mantém tudo derivado de uma consulta
  - ⚠️ Com o bônus, `pontos` **não** é `20 × tarefas`: 3 tarefas dão 110. Se alguém "consertar" isso, é regressão.
- [ ] **Confirmar que prova não pontua** — decisão do autor. `prova` não tem `status` nem `concluida_em`, e a nota está bloqueada (ADR-0007).
- [ ] **Conquistas: fora do MVP.** "Prova ≥ 7" depende da escala da nota; as outras (5 tarefas na semana, primeira semana completa) cada uma pede estado próprio. Uma por vez, depois.
- [ ] **Sem estado de "perdeu":** a sequência não zera em destaque, não aparece com 0 ou 1 dia, e o número mostrado é o recorde quando a atual zera. Um streak zerado afirma uma falha que o app não consegue ver.
- [ ] **Punição:** fora do V1; só recompensa.

## 5. Escopo V1 (o que entra e o que FICA FORA)

**Entra no MVP (2ª VA, 16/11) — 9 requisitos.** A lista completa e a ordem de corte estão no §7 e no README.
- Conta individual + auth por e-mail/senha (cookie httpOnly, refresh rotativo, fuso por usuário). **Login com Google fica para depois** (RF13).
- `periodo` (semestre aberto/arquivado **manualmente** pelo aluno — faculdade é caótica)
- `disciplina` + `tarefa` (**formulário só com título, prazo e concluída**) + `prova` (**só data e título**)
- Grade-tipo semanal (horários fixos) + `cancelamento` por instância (some do dia e silencia o lembrete)
- Telas **Hoje** e **Semana** — mobile-first, toque, semana começa segunda. **Sem visão de Mês e sem realce de colisões.**
- Gamificação mínima: 20 pontos por tarefa, nível a cada 3 tarefas, mais 50 na subida, e a sequência de dias (ADR-0008)

**Fica para depois da apresentação:**
- Web push (RF07): tarefa 24h antes; prova cascata 7-3-1; job cron no Spring. J unto com o manifest e o service worker (ADR-0006).
- Preferências de notificação (RF12, adiado) — as antecedências ficam **fixas** no MVP.
- Visão de Mês, realce de colisões (RF09), login com Google (RF13), conquistas, e nota/peso de prova (ADR-0007).

**Fica FORA do V1 (registrar como "não": evita retrabalho):**
- Mobile nativo (Expo) — e **nenhum app nas lojas** em nenhuma etapa do V1. A Rota de Estudo é PWA: o aviso é Web Push, entregue pelo sistema operacional a partir do PWA. No iOS isso só funciona com o app na tela de início, e é a causa nº 1 de "no iPhone não avisa" (ADR-0006).
- Drag-and-drop no calendário
- Edição offline com fila de sync (vai ter só cache de assets)
- Motor de recorrência (RRULE) — cancelamento por exceção cobre o caso real
- Troca de horário / "aula extra"
- Punição na gamificação
- Compartilhamento/multi-usuário nos dados

## 6. Escopo visual e domínio — decisões em aberto (2026-09-29)

> A identidade visual foi fechada em [`DESIGN.md`](./DESIGN.md) (tema *Academic Kinetic*, paleta por slot semântico, contraste WCAG AA medido). O que ficou **em aberto** são decisões de produto, e por isso são da reunião, não do código.

### 6.1 Navegação — quantas abas e quais

O shell atual (`front/src/App.tsx`) rota `/hoje`, `/semana`, `/mes`. A especificação de design propõe `/hoje`, `/semana`, `/disciplinas`, `/conquistas`. **As duas não batem.**

- [ ] *Mês* é aba própria ou fica dentro de *Hoje*/*Semana*? O endpoint de intervalo (`From`/`To`) já existe no contrato.
- [ ] *Disciplinas* é aba de 4º nível ou seção dentro de *Hoje*?
- [ ] *Conquistas* entra agora (aba vazia até a Fase 3) ou só quando a gamificação existir?
- [ ] **Restrição a considerar:** 4 abas é o máximo confortável no polegar. 5 não cabe bem.

### 6.2 Metadados que a UI promete e o banco não tem

A spec de design mostra esses dados nos cards, mas a migration V1 não os tem. Entram ou saem do escopo?

- [ ] `disciplina.codigo` — os badges `CC204` / `MAT102` não têm origem. **Decidir: entra na V2 ou os cards mostram só o nome?**
- [ ] `horario.sala` / `bloco` / `professor` — o card de aula promete sala, bloco e professor. **Entra na V2 ou o card mostra só horário + disciplina?**
- [ ] `usuario.avatar` — o header mostra avatar; hoje não há campo. Estático, campo novo, ou sem avatar?
- [ ] `prova.tipo` — "Trabalho em Grupo" aparece como badge, mas `prova` não tem tipo (só `tarefa` tem `TRABALHO`). Texto livre, campo novo, ou o badge sai?
- [ ] **Escala da nota e unidade do peso** (§6.2): o banco guarda `nota` em 0–100, mas a regra de gamificação fala em "≥ 7", que só existe em escala 0–10. E a spec mostra "Peso 3.0" (coeficiente) onde o contrato pede 0–100 (percentual). **Adiado para a Fase 3 pela [ADR-0007](./adr/0007-peso-e-nota-fora-do-mvp.md)** — só confirmar que a Fase 3 não começa a gamificação de nota antes de decidir.

### 6.3 Controle de faltas — está na spec, não existe no domínio

- [ ] A spec cita "controle de faltas" e "frequência 100%" como pilar, mas **não há entidade de presença** no schema, nem no contrato, nem nas 4 fases do backlog. **Decidir: entra no V1, vira RF de fase posterior, ou sai da spec?** (Recomendação do autor: sai da spec até existir RF — prometer em UI o que não está no domínio é a forma mais cara de retrabalho.)

### 6.4 Colisão de horário — como calcular

- [ ] Não existe endpoint de colisão. **Decidir: cálculo no cliente** (a partir da semana já carregada) **ou endpoint no backend?**
- [ ] O botão "Reorganizar plano de estudo" do card de colisão não está em nenhum RF. **O que ele faz na prática?** (Adiantar prazo? Abrir o planejador? Só levar à lista de tarefas?)

### 6.5 Itens já decididos no DESIGN.md — validação, não discussão

- [ ] **Gamificação sai da paleta semântica** (§3.4 do DESIGN.md): streak/XP/nível são decoração, não estado. Isso evita que "streak" e "alerta de 2ª VA" fiquem laranja-sobre-laranja na mesma tela. **Ok com o Luís?**
- [ ] **Estados obrigatórios** `loading` / `empty` / `error` / `offline` em toda tela que busca dados. Custa pouco agora, caro depois. **Ok?**
- [ ] **`Plus Jakarta Sans`** no lugar de `Inter` (hoje a fonte do projeto é `Inter`, a spec pede Plus Jakarta). **Ok?**
- [ ] **Esqueleto PWA** — **já decidido na [ADR-0006](./adr/0006-pwa-shell-vs-push.md)**: manifest, service worker e push vão **todos** para a Fase 2. O esqueleto perdeu prioridade para a gamificação mínima, que a professora pede para a 2ª VA. O RNF01 deixou de exigir instalação. **Falta validar com o Luís** — e a consequência de UX continua valendo: **no iOS o push só funciona com o app na tela de início**.

## 7. Escopo da apresentação (bloqueante — decidir AQUI)

> A apresentação é na **2ª VA, 16/11**. Não é na 3ª — a 3ª só acontece se o grupo não for aprovado nas duas primeiras. Sete semanas, API ainda no esqueleto, e um dos dois aprendendo Spring: **não há folga.** Estas decisões precisam sair da reunião, não na véspera.

- [ ] **Confirmar os 9 requisitos do MVP** (README, *O que é o MVP*): RF01 entrar · RF02 período e matéria · RF03 tarefa · RF10 painel Hoje · RF08 pontos e nível · RF04 data de prova · RF05 grade · RF06 cancelar aula · RF11 visão da semana.
- [ ] **Aprovar a ordem de corte** (README, *Ordem de corte se o prazo apertar*), para não ser decisão de pânico:
  1. **RF11** — a tela da Semana vira um bloco dentro do Hoje (tira uma tela, o dado fica)
  2. **RF04** — sai o registro de provas (o Hoje perde a contagem de prova)
  3. **RF08** — sai a gamificação, **só se a professora abrir mão**, e dizendo a ela
  - **Nunca cortar RF06** (cancelar aula): é a diferença do produto e o mais barato — a tabela e as triggers já existem
- [ ] **Confirmar o que não se promete** na apresentação: sem aviso no celular, sem visão do mês, sem colisão de horário, sem entrar com Google, sem nota e peso de prova, sem conquistas, sem instalar como app.
- [ ] **Combinar o deploy:** está na mesma semana da apresentação. Quem sobe, e em que dia? O Compose local é o plano B — alguém precisa saber disso antes, não no dia.
- [ ] **Avisar a professora** de que a gamificação entra em versão mínima (20 pontos por tarefa, nível a cada 3, mais 50 na subida) e que a nota das provas fica pra depois. Melhor ela saber a versão real do que ver promessa que não cumpriu.

## 8. Operação pós-reunião

- [ ] Quem monta o **scaffold inicial** de cada módulo (`front/`, `api/`) e quando?
- [ ] **Prazo** da primeira entrega jogável (uma tela + um endpoint mínimo?)
- [ ] **Cadência de encontro** — semanal? bi-semanal?
- [ ] Onde vive o **kanban**: vault (Obsidian) vs GitHub Issues vs outro. Decidir 1.
- [ ] Próxima reunião agendada (data/hora).

---

## Resultado esperado da reunião

Escrito no final (preencher):
- [ ] Divisão de trabalho decidida
- [ ] Dono/escrita do contrato de API definido
- [ ] ADR-0001/0002/0003 validadas (ou nova ADR se o Luís trouxer algo real)
- [ ] XP v0 confirmada (ou números ajustados)
- [ ] **Abas da navegação definidas** (§6.1)
- [ ] **Metadados da V2 definidos: entram ou saem** (§6.2)
- [ ] **Controle de faltas: dentro do V1, depois, ou fora** (§6.3)
- [ ] **Colisão: cliente ou backend; o que o botão faz** (§6.4)
- [ ] **Corte de fase do PWA validado** (§6.5) — e a limitação do iOS registrada no contrato de UX
- [ ] **Escopo dos 9 requisitos e a ordem de corte aprovados** (§7)
- [ ] **Deploy da 2ª VA combinado** — quem sobe e quando (§7)
- [ ] Kanban + cadência + prazo da primeira entrega fechados

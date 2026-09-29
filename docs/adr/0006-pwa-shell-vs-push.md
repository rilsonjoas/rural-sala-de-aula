# ADR-0006: PWA e Web Push ficam para depois da apresentação

- **Status:** accepted (2026-09-29) · **decisão vigente: o esqueleto PWA também foi adiado**
- **Vigente:** manifest, service worker e Web Push são todos da Fase 2 (pós-apresentação). O RNF01 não exige instalação.

> ⚠️ **O texto das §§Decisão e Consequências abaixo é o registro do que foi decidido às 14h e revertido no mesmo dia.** Ele está preservado como histórico, mas **não é a decisão vigente**. A decisão que vale é o *Complemento* do fim do arquivo, e o que substitui a coluna da tabela. Se você leu só até aqui e parou, a leitura errada é essa.

## Contexto

A ADR-0002 assume **PWA com web push** como pilar de UX, e o RF07 (lembretes) é o único requisito que depende disso. Duas coisas vinham sendo tratadas como uma só:

1. **O esqueleto instalável** — `manifest.webmanifest` + service worker + cache do shell.
2. **O web push** — VAPID, job cron no Spring, tabela de subscriptions, preferências por evento, cascata 7-3-1.

O esqueleto não existe no repositório: `front/public/` está vazio e não há plugin PWA no `package.json`, apesar de a stack declarar "PWA" e o RNF01 exigir "suporte a instalação PWA". Hoje não há nem push nem app instalável.

O web push, por outro lado, é a funcionalidade **mais pesada em backend do contrato inteiro** — quase toda a lógica está no Spring, não no front — e já estava classificada em P3, na Fase 2, atrás do Core.

A pergunta prática: o push pode ser PWA em vez de app nativo, e pode ficar abaixo na prioridade?

## Decisão

**Sim para as duas, e o corte é entre elas.**

**Web Push é PWA puro.** `PushManager` + service worker + VAPID no backend é a via padrão da plataforma e não exige app nativo. As restrições reais: exige **HTTPS** (fora de localhost) e, no **iOS, só dispara se o PWA estiver instalada na tela de início** (Safari 16.4+) — sem isso, não há notificação no iPhone. Suporte consistente em Android e desktop.

**Não haverá app nas lojas.** Nenhuma entrega do V1 publica aplicativo em Play Store ou App Store, e nenhuma etapa do roadmap prevê isso. O que existe é a Rota de Estudo como PWA: o aluno acessa pelo navegador, pode adicioná-la à tela de início e recebe o aviso pelo próprio sistema operacional.

Isso vale a pena fixar sem ambiguidade, porque a entrega da notificação **parece** nativa mesmo não sendo:

| Onde | Como o aviso chega | Tem que fazer algo antes? |
|---|---|---|
| Android (Chrome) | notificação do sistema, com ícone do PWA | instalar o PWA é opcional;sem instalar, o aviso só chega com o app aberto |
| Desktop (Chrome, Edge, Firefox) | notificação do sistema | nada |
| **iOS (Safari)** | Central de Notificações e tela de bloqueio, igual a app | **sim** — precisa estar **adicionado à tela de início**; como aba do Safari, não chega nada |

Ou seja: no iPhone o aviso é entregue pelo iOS e é indistinguível de um app nativo, mas o app **não existe** — não há download, não há ícone na pasta de aplicativos, não há atualização pela loja. Se alguém esperar "instalar o Rota de Estudo na Play Store", a expectativa está errada e a falha no iOS vai parecer que o produto está quebrado.

**O esqueleto PWA sobe para o fim da Fase 1; o push permanece em P3, na Fase 2.**

| | Fase 1 (2ª VA) | Fase 2 (3ª VA) |
|---|---|---|
| `manifest.webmanifest` + service worker + cache do shell | entra | — |
| Botão "instalar app" e ícone standalone | entra | — |
| `PushManager` / VAPID / tabela de subscriptions | — | entra |
| Job cron (24h tarefa; 7-3-1 prova) | — | entra |
| Tela de preferências por evento (RF12) | — | adiado, fora do MVP |

O push **não sobe de prioridade**: continua sendo o último item em P3, e a ordem de implementação dos RFs não muda. O que muda é que o pré-requisito barato deixa de estar escondido dentro da Fase 2.

Subir o push para P2 foi descartado: é a feature mais pesada em backend do contrato, disputando com a agenda completa (P2) um prazo de 2ª VA apertado — e o custo é todo Spring, que não escala com o que o front já entrega. Mobile nativo (Expo) foi descartado por dois codebases. Empurar o manifest para a Fase 2 junto com o push foi descartado porque mistura uma tarefa de um dia com uma de várias semanas e deixa o RNF01 sem lastro até a 3ª VA.

## Consequências

- O RNF01 (instalação PWA) ganha lastro na 2ª VA, e o RF07 deixa de estar bloqueado por um item invisível.
- Custo curto: um item pequeno no fim da Fase 1. Nenhum RF, nenhuma prioridade e nenhuma ordem de implementação muda.
- A registrar na UX: no iOS é preciso avisar que, sem instalar na tela de início, não há lembrete. Sem isso, o RF07 entrega menos do que o texto sugere no iPhone.
- O `offline` completo continua fora do V1 (pauta da reunião 01): só cache de assets, sem edição offline com fila de sync.
- Se a Fase 1 estourar o prazo, o esqueleto PWA é o **primeiro item a cortar** — é acessório e não carrega nenhum RF. O corte é seguro justamente por isso.

## Complemento (2026-09-29): o esqueleto também foi adiado

A decisão acima subia o manifest e o service worker para o fim da Fase 1. **Isso foi revertido no mesmo dia.** A gamificação mínima passou a entrar no MVP por exigência da professora, e o esqueleto PWA perdeu a prioridade para ela.

O corte é seguro porque **nenhuma entrega mínima depende dele**:

| Entrega mínima | Depende do service worker? |
|---|---|
| Deploy na VPS da 2ª VA | Não — Traefik serve a SPA sem ele |
| RNF01 (360px, operável por toque) | Não — a instalabilidade saiu do critério |
| Push e `Notification` | Já eram pós-apresentação |

O que muda é **onde o gancho é construído**: manifest e service worker passam a ser feitos na Fase 2, junto com o push que depende deles. Custa ~1 dia a mais lá, e é o preço de colocar no MVP a gamificação que a professora pede.

A consequência do RNF01 é a parte que não se desfaz: o requisito de instalabilidade deixa de existir até a Fase 2 voltar a escrevê-lo. Nenhuma frase do repositório deve prometer "instalar" antes disso.

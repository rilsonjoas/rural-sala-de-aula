# CONTEXT.md — Rota de Estudo (StudyPath)

Glossário acordado do domínio. Use esses termos com precisão no código, nos tickets e nas ADRs.

## Termos

| Termo | Definição | Regras/notas |
|---|---|---|
| `usuario` | Pessoa com conta no app. **Dono dos próprios dados** — contas são 100% individuais, sem compartilhamento multi-usuário. | Autorização por dono em toda rota (padrão Assídua). |
| `periodo` | O "semestre" do aluno: contêiner de topo que agrupa disciplinas, horários e provas. Tem nome + data início/fim **opcionais**. **Aberto e arquivado manualmente pelo aluno** (faculdades não seguem calendário único; nada de auto-detectar datas). | 1 período ativo; vários arquivados. Somente o ativo recebe novos itens. Proibido RRULE. |
| `disciplina` | Eixo central do estudo — toda `tarefa` e toda `prova` pertencem a exatamente uma disciplina. | |
| `tarefa` | Entrega com prazo. **No MVP o formulário é só título, prazo e concluída** (ADR-0008). `tipo` (TAREFA \| TRABALHO \| OUTRO), prioridade, descrição e tags existem no schema, opcionais, sem tela. | O XP vem só daqui e é fixo em 20 — por isso a prioridade e o tipo não pesam no cálculo. |
| `prova` | Avaliação com **data** (o que o MVP usa: RF10, RF11, RF07). `peso` e `nota` existem na tabela mas **não são exigidas no MVP** — ADR-0007. | ⚠️ Escala em conflito, por resolver na Fase 3: o banco guarda `nota` em 0–100, mas a regra de gamificação fala em "≥ 7" (escala 0–10). A unidade do `peso` também não está decidida: 0–100 no contrato, "Peso 3.0" na `DESIGN.md`. Não escrever regra de XP ou média antes de resolver. | |
| `horario` | Aula semanal fixa (dia da semana + hora): a **grade-tipo**. Não é um motor de recorrência genérico; é uma lista fixa de slots que se repete toda semana dentro do período. | `dia_semana` é 1–7 em ISO (1 = segunda). |
| `cancelamento` | Exceção por instância: "aula de X cancelada em DD/MM". Some daquele dia no calendário **e silencia o lembrete daquele dia**. Sem "troca de horário" nem "aula extra" no V1. | **Duas invariantes garantidas no banco por trigger** (V1), não só no código: (1) `data_cancelamento` precisa cair no `dia_semana` do `horario`; (2) `horario.dia_semana` fica bloqueado enquanto houver `cancelamento` — desfaça-os antes. Ver *Invariantes do domínio* abaixo. |
| `config_notificacao` | Antecedências (quanto tempo antes) por tipo de evento, em lista de minutos, para suportar a cascata de provas (7-3-1) e o aviso único de tarefas. **No MVP as antecedências são fixas e o aluno não edita** — RF12 está adiado. | `antecedencias_minutos` é uma lista, para suportar tarefa 24h antes e prova em cascata 7-3-1. As três linhas são semeadas por trigger no cadastro — ver *Invariantes do domínio*. |
| `gamificacao` | Produz XP, nível e sequência de dias. **Entra no MVP em nível mínimo** (ADR-0008), derivado por consulta de `tarefa` — sem tabela, sem serviço de eventos, sem acoplar nada ao CRUD. Conquistas e punição ficam para depois. | Ver *Streak* e *XP*. |
| `rota-de-estudo` / `study-path` | Nome do produto: Rota de Estudo (pt) / StudyPath (en). | Decisão de i18n — ver ADR-0003. |

## Invariantes do domínio

Regras que o banco garante sozinho, por trigger na `V1__create_core_schema.sql`. Estão no banco e não na aplicação de propósito: o projeto roda teste local, sem CI (ver `pauta-reuniao-01.md` §3), e uma guarda de banco é o único lugar que não depende de alguém lembrar de rodar a suíte.

| Invariante | Trigger | SQLSTATE |
|---|---|---|
| `cancelamento.data_cancelamento` cai no `dia_semana` do `horario` | `cancelamento_data_confere_dia_semana` | `23514` |
| `horario.dia_semana` não muda com `cancelamento` existente | `horario_dia_semana_bloqueado_com_cancelamento` | `23514` |
| Todo `usuario` novo tem as 3 antecedências do MVP | `usuario_preferencias_notificacao_padrao` | — |

## XP e nível (mínimo do MVP)

**Duas fórmulas, e só elas:**

```
nível  = (tarefas concluídas ÷ 3) + 1
pontos = (20 × tarefas) + (50 × (nível − 1))
```

O nível vem das **tarefas**, nunca dos pontos. Isso é o que evita uma equação circular: se o nível dependesse dos pontos e os pontos dependessem do nível, não haveria resposta. Como o nível vem das tarefas, os dois números são funções puras de `tarefa` e a fórmula fecha sem iteração.

**Nada disso cria tabela.** `nível` e `pontos` saem da mesma consulta que já conta as tarefas concluídas. Zero migration, zero caminho de escrita, zero estado que possa divergir. Reabrir uma tarefa rebaixa os dois sozinho.

| Tarefas | Nível | Pontos | Falta pro próximo |
|---|---|---|---|
| 0 | 1 | 0 | faltam 3 |
| 1 | 1 | 20 | faltam 2 |
| 2 | 1 | 40 | faltam 1 |
| 3 | 2 | 110 | faltam 3 |
| 5 | 2 | 150 | faltam 1 |
| 6 | 3 | 220 | faltam 3 |
| 9 | 4 | 330 | faltam 3 |
| 12 | 5 | 440 | faltam 3 |
| 15 | 6 | 550 | faltam 3 |
| 18 | 7 | 660 | faltam 3 |
| 21 | 8 | 770 | nível máximo |

⚠️ **O número de pontos não é mais `20 × tarefas`.** Com o bônus de 50 por nível, 3 tarefas dão 110 e não 60. Isso é intencional e é o preço do bônus: o student vê um número que não bate com a contagem direta das tarefas. A fórmula acima é a fonte da verdade — se alguém "corrigir" o backend para fazer `pontos = 20 × tarefas` e o bônus sumir, é regressão, não bug.

**Calibrado para a realidade do curso, não para o ideal: 2 a 3 tarefas por semana.** Uma tabela calibrada para 15 por semana faria o aluno travar no nível 3 e a gamificação parecer quebrada. Com 2,5 por semana, quem apresenta na 2ª VA chega ao nível 6 com 17 tarefas.

**Quando sobe de nível, o momento importa mais que o número.** O "Nível 4" ganha um destaque breve no lugar, e o header mostra "faltam 2 tarefas" para o próximo. Sem popup, sem modal, sem bloquear a conclusão da tarefa — o feedback real do RF03 (a tarefa sai da lista) continua sendo o principal.

Mudança de regra no futuro recalcula o passado de todo mundo. Para a demonstração isso é vantagem; se incomodar, o ledger (`xp_evento`) é o momento de introduzi-lo, não antes.

**Só tarefa conta. Prova não dá XP nem sobe nível** — decisão de 2026-09-29. A prova é uma data no calendário, não um item que o aluno marca: `prova` não tem `status` nem `concluida_em`, e o único sinal possível seria a nota, bloqueada pela ADR-0007. Misturar "itens que você controla" com "coisas que acontecem com o tempo" também deixaria o nível imprevisível para o aluno.

## Streak

Contagem de **dias consecutivos de atividade**, não de tarefas. O eixo é o dia do calendário; a tarefa é o que marca o dia. Um contador de tarefas seria monotônico — só cresce, nunca quebra — e portanto não seria streak.

Duas alternativas que **não** são a mesma métrica: "tarefas consecutivas" não tem ordem definida (criação, prazo ou conclusão?) e, por ordem de conclusão, o aluno marca cinco tarefas antigas de uma vez e ganha sequência de cinco sem ter estudado um único dia.

Três regras que precisam estar explícitas, porque cada uma já coube num bug:

- **Fuso do usuário.** O dia é o do aluno, no fuso dele (`usuario.fuso_horario`). Contar em UTC zera o streak de quem estuda à noite — mesma razão da regra "nada de 'hoje' fixo em UTC".
- **O que conta como dia ativo.** Pelo menos uma tarefa com `concluida_em` naquele dia. Estudar, ler, frequentar aula não contam, porque não há dado que registre isso.
- **Sem histórico.** O streak é recalculado do zero a partir de `concluida_em`. Concluir ou reabrir uma tarefa com data passada recalcula o passado; não há snapshot. Barato e suficiente para o MVP.

**A sequência não tem estado de "perdeu".** Ela mede dias com tarefa marcada no app, que não é o mesmo que dias em que o aluno estudou — o app só enxerga a marcação. Então:

- Sequência **não aparece** com 0 ou 1 dia. Sem histórico, o header mostra só "Nível 1 · 0 XP", sem zero em destaque e sem ícone de fogo apagado.
- Aparece a partir de **2 dias**, e o número exibido é o **recorde** quando a atual zera — perder a sequência não apaga o que foi feito.
- Nenhum modal ou animação bloqueia a conclusão de uma tarefa. O feedback real é o RF03 (a tarefa sai da lista).

## Antecedências do MVP (fixas)

Sem tela de preferências: o aluno **não edita** antecedência no MVP. RF12 está adiado, então estes valores são produto, não preferência.

| Evento | Antecedências | Significado |
|---|---|---|
| `TAREFA` | `{1440}` | 24 h antes |
| `PROVA` | `{10080, 4320, 1440}` | cascata 7-3-1 dias |
| `AULA` | `{1440}` | 24 h antes |

A semeadura é por trigger, não por código de aplicação, por dois motivos: nenhum caminho de criação de usuário pode esquecer as três linhas, e sendo o trigger o único escritor, **os únicos valores que existem na tabela são estes** — as brechas do `CHECK` (sem teto de antecedência, sem dedup) ficam inalcançáveis por construção, o que também resolve o "nenhum aviso repetido" da HU03 sem trabalho extra.

Quando RF12 voltar, estes passam a ser o *default* sobrescrevível, e o `CHECK` ganha teto e dedup antes de a tela existir.

Por que a segunda: o cancelamento guarda a **data**, mas a aula é um **dia da semana**. Mover a aula deixaria o cancelamento apontando para a data errada — a aula reaparece no dia antigo e some no novo. A guarda força a resposta explícita: desfazer os cancelamentos primeiro. Alterar o *horário* do dia continua livre; só o dia da semana é bloqueado.

Pendência da Fase 1: traduzir `23514` em **400** no `@RestControllerAdvice`. A API hoje só tem `HealthController`, então a trigger sobe como 500 — o código HTTP do contrato ainda não existe para receber o erro.

## Persistência inicial

A migration `V1__create_core_schema.sql` cria `usuario`, `periodo`, `disciplina`, `tarefa`, `prova`, `horario`, `cancelamento` e `config_notificacao`. O banco de produção é `rota_de_estudo_db`, com role isolada `rota_app`; a definição do schema é sempre versionada pelo Flyway.

## Indefinições a resolver (não bloquear)

- Papel do **Luiz** na dupla (nível em React/Java, divisão de trabalho, review) — aguardando reunião da dupla. O **contrato de API** é a fronteira natural entre os dois (ver Fase 0).
- Regras exatas de XP/conquistas (tabela v0 registrada no vault; números ajustáveis).
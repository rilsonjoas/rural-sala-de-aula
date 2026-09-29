# ADR-0008: Gamificação mínima no MVP, derivada de `tarefa`

- **Status:** accepted (2026-09-29)

## Contexto

A professora pede gamificação para a 2ª VA, que é a apresentação. Isso inverte a premissa que os documentos carregavam até aqui — o `.docx` dizia que gamificação "depende de dados reais e fica para a última etapa" — e é a razão de o esqueleto PWA ter sido adiado (ADR-0006, complemento).

O módulo `gamificacao` não existe: zero código, zero migration, zero contrato. A tabela v0 de XP na pauta tem três fontes, e uma delas está bloqueada:

| Fonte da tabela v0 | Situação |
|---|---|
| Tarefa concluída: `10 × prioridade` | ✅ `tarefa` está no MVP |
| Trabalho concluído: `50` | ✅ é `tarefa` com `tipo = TRABALHO` |
| **Nota registrada: `20`** | ❌ **bloqueada pela ADR-0007** — a escala da nota não foi decidida |

A mesma tabela ainda carrega **três regras diferentes para a mesma pergunta**: a pauta diz `50` para trabalho, o `CONTEXT.md` diz "XP dobrado" (= 20 para prioridade média), e `10 × prioridade` dá 30 para uma tarefa de prioridade alta — que é mais que 50 só quando combinadas. Não há resposta única, e resolver isso custaria mais tempo do que a regra inteira.

## Decisão

**A gamificação mínima é XP, nível e sequência de dias, e vem só de `tarefa`.**

Três decisões encadeadas:

**1. Duas fórmulas, e nada mais:**

```
nível  = (tarefas concluídas ÷ 3) + 1
pontos = (20 × tarefas) + (50 × (nível − 1))
```

O nível vem das **tarefas**, nunca dos pontos. É o que evita a equação circular: se o nível dependesse dos pontos e os pontos dependessem do nível, não haveria resposta. Como o nível vem das tarefas, os dois são funções puras de `tarefa` e a fórmula fecha sem iteração.

Os 20 por tarefa sem multiplicador, e `tipo` e `prioridade` fora do formulário, **dissolvem as três regras conflitantes** da tabela v0 (`10 × prioridade`, `50` para trabalho, "XP dobrado"). Cortar a fonte nota é obrigatório de qualquer forma (ADR-0007).

A cadência foi calibrada para **2 a 3 tarefas por semana**, que é o que um estudante de faculdade realmente faz — a primeira versão desta ADR chutava 15 por semana e produzia uma tabela que travava no nível 3.

**2. Nenhuma tabela nova.** `nível` e `pontos` saem da mesma consulta que já conta as tarefas concluídas, e a sequência vem de `DATE(concluida_em)` no fuso do usuário. Zero migration, zero caminho de escrita, zero estado que possa divergir — e reabrir uma tarefa rebaixa os dois automaticamente, porque não há nada para sincronizar.

**3. `tipo` e `prioridade` saem do formulário** (`CONTEXT.md` tem a regra completa). Continuam no schema e continuam opcionais, caso a interface precise deles depois.

### Níveis e pontos

| Tarefas | Nível | Pontos | Falta pro próximo |
|---|---|---|---|
| 0 | 1 | 0 | faltam 3 |
| 2 | 1 | 40 | falta 1 |
| 3 | 2 | 110 | faltam 3 |
| 6 | 3 | 220 | faltam 3 |
| 9 | 4 | 330 | faltam 3 |
| 12 | 5 | 440 | faltam 3 |
| 15 | 6 | 550 | faltam 3 |
| 18 | 7 | 660 | faltam 3 |
| 21 | 8 | 770 | nível máximo |

⚠️ **Com o bônus, `pontos` deixa de ser `20 × tarefas`.** Três tarefas dão 110, não 60. É intencional, e é o preço do bônus escolhido: o número na tela deixa de bater com a contagem direta das tarefas. A fórmula acima é a fonte da verdade — se alguém "consertar" o backend para `pontos = 20 × tarefas` e o bônus desaparecer, isso é regressão, não correção.

A alternativa considerada era não dar bônus em pontos e concentrar a recompensa no momento da subida. As duas juntas foram escolhidas: o bônus dá o número, o momento dá a sensação.

### O momento da subida

Quando o nível muda, o número do nível **ganha um destaque breve no lugar** e o header passa a mostrar "faltam N tarefas" para o próximo. Sem popup, sem modal, sem bloquear a conclusão da tarefa — o feedback real do RF03 (a tarefa sai da lista) continua sendo o principal. A gamificação é leitura ao lado, não interrupção.

### A entrega

- **1 contrato:** `GET /api/v1/gamificacao/perfil` → `{ tarefasConcluidas, xpTotal, nivel, proximoNivel, tarefasParaProximoNivel, streakAtual, streakRecorde }`
- **1 service:** `GamificacaoService`, lê `tarefa` do período ativo, no fuso do usuário
- **1 componente:** uma faixa no header do Hoje com nível, XP, "faltam N tarefas" e sequência

Nada mais. Sem tela de entrada de dado, sem modal, sem escrita.

### Interface: o número é verdade?

A revisão de interface ética do projeto (ponto 4 da lista de "locais onde o autor já escorrega") proíbe veredito automático de perda. A sequência conta **dias com tarefa concluída no app**, que não é a mesma coisa que "dias em que o aluno estudou" — o app não enxerga estudar, só a marcação. Então:

- A sequência **não zera em destaque**. Aluno com zero histórico vê "Nível 1 · 0 XP" e **nada de sequência** — sem ícone de fogo apagado, sem zero em vermelho.
- A sequência aparece a partir de **2 dias**. Abaixo disso não há o que celebrar nem o que perder.
- O número de **recorde** é preservado. Perder a sequência atual não apaga o recorde, e o recorde é o número que se mostra.
- Nenhum modal, confete ou animação bloqueia a conclusão de uma tarefa. O feedback real do RF03 (a tarefa sai da lista) já é o suficiente; a gamificação é leitura ao lado.

### Fora do mínimo

- **Nota → XP** — ADR-0007
- **Conquistas** — a de "prova ≥ 7" está bloqueada pela escala, e as outras (5 tarefas na semana, primeira semana completa) cada uma exige estado próprio
- **XP por prova** — decisão do autor (2026-09-29): **prova não conta para o nível nem para os pontos**, por agora. Não é esquecimento, é escolha. Duas razões se reforçam: a tabela `prova` não tem `status` nem `concluida_em`, então não existe como o aluno marcar que a fez; e o único sinal disponível seria `nota IS NOT NULL`, que está bloqueado pela ADR-0007. Se um dia contar, é `concluida_em` em `prova` (ADR nova) — não é leitura de `nota`.
- **XP por aula** — não há evento confiável, e `cancelamento` contaminaria a contagem (uma aula cancelada é ausência, não atividade)
- **Ledger de XP** (`xp_evento`) — é o que permite "recompensa por peso" depois; custa migration, escrita e revogação. Decisão de Fase 3
- **Punição** — fora do V1 por decisão anterior

## Consequências

- A métrica é sempre consistente com `tarefa`, porque não existe segunda cópia do estado.
- Mudar a regra de XP no futuro **recalcula o passado** de todo mundo. Para uma demonstração isso é até vantagem — os números podem ser ajustados para a demo. Se isso incomodar, o ledger é o momento de introduzi-lo, não antes.
- A sequência é uma **medida de uso do app, não de estudo**. Isso é honesto desde que a interface não afirme o contrário, e por isso ela não tem estado de "perdeu".
- Sem `prioridade` no formulário, o card de entrega perde o selo "prioridade alta" que aparece no mockup da capa. Os tokens de cor continuam no DESIGN.md para quando o campo voltar.
- O RNF01 deixou de exigir instalação PWA e o esqueleto foi para a Fase 2 (ADR-0006) — foi a troca que abriu espaço para isto.

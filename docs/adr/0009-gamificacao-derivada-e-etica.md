# ADR-0009 — Gamificação derivada e ética

Status: aceito (2026-10-29)

## Contexto

O projeto previa incentivar a organização do estudante e o cumprimento de prazos acadêmicos. Durante o escopo P1, qualquer mecânica de gamificação ficou fora de escopo para focar na entrega dos requisitos essenciais do Classroom.

Com o P1 entregue e em produção (Hetzner VPS, CI verde, 120 verificações) e o back-end das próximas semanas alocado para o Luiz (grupos, membros e notificações), a gamificação é introduzida como camada de engajamento do aluno sem criar dependências ou bloqueios de infraestrutura.

## Decisão

A gamificação é **100% derivada, ética e sem tabelas adicionais no banco de dados**.

### 1. Estado derivado e papel de estudante (Zero migrations)
Nível, XP, sequência e conquistas são funções puras dos dados que o usuário consulta nas turmas em que cursa (`Atividade`, `Entrega`, `Avaliacao`).
* **Papel contextual (ADR-0008):** a gamificação se aplica exclusivamente ao usuário no papel de estudante. O cálculo consome `GET /atividades`, que retorna unicamente as atividades das turmas nas quais o usuário está matriculado como aluno. Turmas que o usuário administra como professor não interferem no seu XP, nível ou conquistas.
* **Sem replicação de estado:** não há tabela de saldo de pontos nem eventos de XP persistidos.
* Se uma atividade é entregue ou avaliada, o progresso recalcula automaticamente.

### 2. Regras de pontuação (XP)
* **Entrega no prazo:** `+50 XP` (atividade no estado `ENTREGUE` ou `CONCLUIDA` com `atrasada == false`).
* **Bônus de antecedência:** `+20 XP` para entregas feitas com $\ge 24\text{ h}$ de antecedência em relação ao `prazoFinal`.
* **Avaliação pelo professor:** `+30 XP` quando a atividade recebe nota/feedback (`nota != null`).
  * *Bônus de excelência:* `+10 XP` se a `nota >= 7.0`.
* **Entrega com atraso:** `+15 XP` (premia o esforço de entrega sem aplicar punições desmotivadoras).

### 3. Nível do estudante
O nível avança com base no volume de atividades entregues com sucesso:
$$\text{Nível} = \lfloor \text{entregasConcluídas} / 3 \rfloor + 1$$
* O progresso dentro do nível é medido de 0 a 3 tarefas para a próxima subida.

### 4. Consistência (Streak) ética
* Mede semanas consecutivas em que o estudante realizou ao menos uma entrega no prazo.
* Exibição a partir de **2 semanas** (ex.: `🔥 2 semanas em dia`).
* **Design ético:** se o aluno passar uma semana sem entregas, não há telas punitivas, alertas vermelhos de perda ou "fogo apagado". O recorde histórico da sequência é preservado.

### 5. As 6 Conquistas Acadêmicas (Badges)
1. **Primeiro Passo:** realizou a 1ª entrega no sistema.
2. **Pontualidade Rural:** 3 entregas concluídas sem atraso.
3. **Sempre Adiante:** ao menos 1 entrega enviada com $\ge 24\text{ h}$ de antecedência.
4. **Nota de Destaque:** recebeu nota $\ge 9{,}0$ em uma avaliação.
5. **Semestre em Dia:** nenhuma atividade atrasada em todas as turmas em que está matriculado.
6. **Espírito de Equipe:** realizou entrega em atividade do tipo `PROJETO_EM_GRUPO`.

### 6. Interface
* **Aba dedicada na navegação (`/conquistas`):** terceira aba ao lado de "Turmas" e "Atividades", presente de forma balanceada tanto na barra inferior do mobile quanto no cabeçalho do desktop (MainNav).
* **Cabeçalho limpo:** sem pílulas comprimidas no header mobile, preservando o layout limpo ao lado do avatar.
* **Ícones do Lucide React:** sem emojis; toda a iconografia de medalhas e consistência usa ícones SVG consistentes da biblioteca Lucide (`Target`, `Clock`, `Zap`, `Award`, `BookOpen`, `Users`, `Flame`, `Check`).
* **Tela de Conquistas (`ConquistasPage`):** exibe card de nível, barra de progresso para a próxima subida, consistência semanal e a grade das 6 conquistas acadêmicas com estado claro de "Conquistada" vs "Em progresso".
* **Feedback não invasivo:** sem popups bloqueantes ou modais interruptivos no fluxo de entrega.

## Consequências

* **Zero impacto no back-end:** a funcionalidade pode ser implementada e testada no front-end de imediato, calculada a partir de `GET /atividades`.
* **Fácil retrocompatibilidade:** o contrato de API pode expor futuramente um endpoint de leitura (ex.: `GET /api/v1/gamificacao/perfil`) caso queira centralizar o cálculo no Spring Boot, sem alterar nenhuma migration existente.


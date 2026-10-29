# ADR-0009 — Gamificação derivada e ética

Status: aceito (2026-10-29)

## Contexto

O projeto previa incentivar a organização do estudante e o cumprimento de prazos acadêmicos. Durante o escopo P1, qualquer mecânica de gamificação ficou fora de escopo para focar na entrega dos requisitos essenciais do Classroom.

Com o P1 entregue e em produção (Hetzner VPS, CI verde, 120 verificações) e o back-end das próximas semanas alocado para o Luiz (grupos, membros e notificações), a gamificação é introduzida como camada de engajamento do aluno sem criar dependências ou bloqueios de infraestrutura.

## Decisão

A gamificação é **100% derivada, ética e sem tabelas adicionais no banco de dados**.

### 1. Estado derivado e papéis contextuais (Zero migrations)
Nível, XP, métricas e conquistas são funções puras dos dados das turmas que o usuário frequenta ou administra (`Turma`, `Atividade`, `Entrega`, `Avaliacao`, `Aviso`, `Comentario`).
* **Papel contextual (ADR-0008):** todo usuário pode cursar turmas (como estudante) e criar/lecionar turmas (como professor). A gamificação reconhece essa dualidade sem misturar as métricas:
  * O **Perfil de Estudante** mede engajamento discente (entregas no prazo, notas recebidas, consistência).
  * O **Perfil Docente** mede zelo pedagógico (agilidade de avaliação, feedback com comentário, presença no mural).
* **Sem replicação de estado:** não há tabelas de pontuação nem jobs assíncronos de cálculo. Toda a informação é derivada das consultas já existentes.

### 2. Gamificação do Estudante
* **Pontuação (XP):**
  * Entrega no prazo: `+50 XP`
  * Bônus de antecedência ($\ge 24\text{ h}$ do prazo): `+20 XP`
  * Avaliação recebida do professor: `+30 XP` (com bônus de `+10 XP` se nota $\ge 7{,}0$)
  * Entrega com atraso: `+15 XP` (sem punições desmotivadoras)
* **Nível Discente:** $\text{Nível} = \lfloor \text{entregasConcluídas} / 3 \rfloor + 1$.
* **Consistência (Streak):** Semanas consecutivas com entregas no prazo (exibido a partir de 2 semanas, sem alerta punitivo de quebra).
* **Medalhas do Estudante (6 conquistas):** *Primeiro Passo*, *Pontualidade Rural*, *Sempre Adiante*, *Nota de Destaque*, *Semestre em Dia*, *Espírito de Equipe*.

### 3. Gamificação do Professor (Painel de Dedicação Docente)
A gamificação docente evita mecânicas infantis de "XP" e foca em **reconhecimento profissional e agilidade pedagógica**:
* **Nível Docente (impacto nas turmas):**
  $$\text{Nível Docente} = \lfloor \text{avaliaçõesRealizadas} / 10 \rfloor + 1$$
  * *Nível 1:* Professor Iniciante
  * *Nível 2:* Professor Orientador
  * *Nível 3:* Professor Mentor
  * *Nível 4+:* Professor Emérito
* **Indicadores de Cuidado Pedagógico:**
  * *Feedbacks Qualitativos:* percentual de avaliações acompanhadas de comentário privado (além da nota fria).
  * *Presença no Mural:* total de avisos publicados e respostas dadas a dúvidas de alunos.
  * *Turmas Ativas:* quantidade de turmas administradas no semestre.
* **Medalhas Docentes (5 conquistas com Lucide React):**
  1. **Diálogo Aberto (`MessageSquareCheck`):** respondeu a dúvidas de alunos no mural (`RF14b`).
  2. **Feedback Completo (`FileCheck2`):** registrou avaliações com comentário privado além da nota (`RF15`).
  3. **Planejamento Claro (`CalendarCheck`):** cadastrou 3 ou mais atividades organizadas numa mesma turma (`RF10`).
  4. **Turma em Dia (`CheckCheck`):** avaliou 100% das entregas recebidas de uma atividade.
  5. **Diversidade Didática (`Layers`):** cadastrou ao menos dois tipos distintos de atividades (ex.: Prova e Lista ou Projeto).

### 4. Interface na aba `/conquistas`
* **Navegação balanceada:** a aba **Conquistas** permanece integrada ao `MainNav` (terceira aba no mobile e link no desktop).
* **Seletor de visão (se aplicável):**
  * Se o usuário **só estuda:** vê diretamente o painel de estudante.
  * Se o usuário **só leciona:** vê diretamente o painel de dedicação docente.
  * Se o usuário **leciona e estuda:** um alternador elegante no topo permite trocar entre `Como Estudante` e `Como Professor`.
* **Design sóbrio:** sem emojis, com componentes do shadcn/ui e ícones Lucide React alinhados aos tokens da UFRPE.

### 6. Interface
* **Aba dedicada na navegação (`/conquistas`):** terceira aba ao lado de "Turmas" e "Atividades", presente de forma balanceada tanto na barra inferior do mobile quanto no cabeçalho do desktop (MainNav).
* **Cabeçalho limpo:** sem pílulas comprimidas no header mobile, preservando o layout limpo ao lado do avatar.
* **Ícones do Lucide React:** sem emojis; toda a iconografia de medalhas e consistência usa ícones SVG consistentes da biblioteca Lucide (`Target`, `Clock`, `Zap`, `Award`, `BookOpen`, `Users`, `Flame`, `Check`).
* **Tela de Conquistas (`ConquistasPage`):** exibe card de nível, barra de progresso para a próxima subida, consistência semanal e a grade das 6 conquistas acadêmicas com estado claro de "Conquistada" vs "Em progresso".
* **Feedback não invasivo:** sem popups bloqueantes ou modais interruptivos no fluxo de entrega.

## Consequências

* **Zero impacto no back-end:** a funcionalidade pode ser implementada e testada no front-end de imediato, calculada a partir de `GET /atividades`.
* **Fácil retrocompatibilidade:** o contrato de API pode expor futuramente um endpoint de leitura (ex.: `GET /api/v1/gamificacao/perfil`) caso queira centralizar o cálculo no Spring Boot, sem alterar nenhuma migration existente.


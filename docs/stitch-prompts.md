# Prompts para o Stitch — Rural Sala de Aula (P1)

Como usar: abra um projeto novo no Stitch, cole o **Prompt-base** primeiro (ele fixa o sistema de design) e depois gere **uma tela por prompt**, na ordem. Para cada tela, gere a versão **mobile** e depois peça a **desktop** (frase pronta no fim de cada prompt). Os prompts estão em inglês porque o Stitch responde melhor, mas todo o texto da interface está em português do Brasil e deve ser mantido exatamente assim.

Registro: estes foram os prompts usados em 08/10/2026 e hoje servem para gerar as telas desktop. A especificação atual das telas é [`design/telas.md`](design/telas.md) (onde divergir, ela vale).

Fonte de verdade: [`DESIGN.md`](DESIGN.md). Se algo divergir, vale o DESIGN.md.

---

## Prompt-base (cole uma vez)

```
Design a responsive web app called "Rural Sala de Aula": a classroom tool (an alternative to Google Classroom) for a Brazilian federal rural university. Two roles: ALUNO (student) and PROFESSOR (teacher). All UI text is in Brazilian Portuguese. Mobile-first, and every screen must also have a desktop version.

Scope is strictly limited to: sign up / sign in, teachers creating classes ("turmas") and activities ("atividades"), students joining a class with a code, students browsing and filtering their activities, students submitting a file, teachers viewing, downloading and grading submissions. Do NOT add anything else: no gamification, levels, streaks, GPA/averages, attendance, credits, calendar, groups, announcements, comments, notifications, sync indicators or settings screens.

Visual identity (institutional colors):
- Navy #1b2d4f: primary text, header, primary buttons, 4px left stripe on class cards
- Red #b61823: ONLY for lateness and errors
- Yellow #f9b233: accent fills only (count badge, highlights) with navy text on top; NEVER yellow text or icons on white
- Page background #f5f6f9, cards white #ffffff, secondary text #5b6475, light navy tint #e8edf7, light red tint #fdecee
- Green #1e7a46 only for the "Concluída" (graded) status
Font: Inter. Sizes 12/14/16/20/24; body text at least 16px in form fields. Corners: 12px cards and sheets, 8px fields and chips, pill badges. Very light shadow on cards only. Clean, calm, academic, high contrast. No logo image: the brand is the text "Rural Sala de Aula" in navy, semibold.

Navigation: header with the brand text on the left and an avatar with initials on the right (menu: name, role, "Sair"). Student mobile: bottom bar with "Turmas" and "Atividades". Teacher: only "Turmas" (no bottom bar). Desktop (≥1024px): fixed left sidebar 240px with the same items; lists of activities/submissions become tables.

Accessibility: WCAG 2.2 AA. Touch targets at least 44px. Status is never conveyed by color alone (always icon + text). Labels always visible above fields. Weekday abbreviations are unambiguous: Seg, Ter, Qua, Qui, Sex, Sáb, Dom.

Every screen must consider: loading (skeleton shaped like the cards), empty (teaches and offers an action), error (says what to do, with a "Tentar de novo" button).
```

---

## Tela 1 — Entrar / Criar conta (RF01)

```
Screen: authentication, one screen with two tabs "Entrar" and "Criar conta". No header navigation. Centered card on desktop, full width on mobile, brand text "Rural Sala de Aula" above.

"Entrar" tab: fields "E-mail" and "Senha" (visible labels), primary button "Entrar". Error state under the fields in red tint: "E-mail ou senha incorretos. Confira e tente de novo."

"Criar conta" tab: fields "Nome", "E-mail", "Senha" (helper text "Mínimo de 8 caracteres"), then "Eu sou" with two large selectable cards side by side: "Aluno" ("Entro em turmas e entrego atividades") and "Professor" ("Crio turmas e avalio entregas"). Nothing preselected. Primary button "Criar conta". Show inline validation errors under the fields (e.g. "Esse e-mail já está cadastrado. Entre ou use outro e-mail.").

Generate the mobile version.
```
Desktop: *"Now create the desktop version of this screen (1280px wide), keeping the same content and states."*

## Tela 2 — Turmas do professor + Nova turma (RF09)

```
Screen: "Minhas turmas" for the PROFESSOR role. Header with brand and avatar menu. Title "Minhas turmas" with a primary button "Nova turma" (top right; full width under the title on mobile). Under it an optional select "Semestre" showing "2026.2".

List of class cards (white, 4px navy left stripe). Each card: class name (e.g. "Turma A — Algoritmos"), discipline ("Algoritmos e Estruturas de Dados II"), semester "2026.2", class days "Seg · Qua", and a row "Código de inscrição" with the code in a monospace pill (e.g. "ABC123") plus a text button "Copiar código" with a copy icon. A secondary outlined button "Ver atividades". Show 3 cards.

Also show, as separate frames: (a) the bottom sheet (mobile) / centered modal (desktop) "Nova turma" with fields "Nome da turma", "Disciplina", "Semestre" (placeholder 2026.2, helper "Formato: ano.1 ou ano.2"), "Dias de aula" (seven toggle chips Seg Ter Qua Qui Sex Sáb Dom, multi-select, each with a check icon when active) and primary button "Cadastrar turma"; (b) the success message "Turma criada. Código de inscrição: ABC123" with "Copiar código"; (c) the empty state "Você ainda não criou turmas." with button "Nova turma"; (d) the loading skeleton.

Generate the mobile version.
```
Desktop: *"Now create the desktop version with the left sidebar (item: Turmas), cards in a 2-column grid, and the modal centered."*

## Tela 3 — Turmas do aluno + Entrar em turma (RF02, RF03)

```
Screen: "Minhas turmas" for the ALUNO role. Header with brand and avatar; bottom bar with "Turmas" (active) and "Atividades". Title "Minhas turmas", primary button "Entrar em turma". Optional select "Semestre" "2026.2".

Class cards (white, 4px navy left stripe): class name ("Turma A — Algoritmos"), discipline, professor name ("Prof. Marcos Silva"), class days "Seg · Qua", a yellow pill with navy text "3 pendentes" (or a navy-tint pill "Em dia" with a check icon), and a secondary outlined button "Ver atividades". Show 3 cards: two with pending counts, one "Em dia".

Also show as separate frames: (a) bottom sheet / modal "Entrar em turma" with one field "Código da turma" (helper "Peça o código ao professor"), primary button "Entrar na turma", and the error "Não encontramos uma turma com esse código. Confira com o professor."; (b) the message "Você já está nesta turma."; (c) empty state "Você ainda não está em nenhuma turma. Peça o código ao professor e entre." with button "Entrar em turma"; (d) loading skeleton; (e) error state "Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo." with "Tentar de novo".

Generate the mobile version.
```
Desktop: *"Now create the desktop version with sidebar (Turmas, Atividades), 2-column card grid, centered modal."*

## Tela 4 — Atividades de uma turma (RF10, RF05)

```
Screen: activities inside one class ("Turma A — Algoritmos"), reached from a class card. Top: back arrow "Turmas", class title, subtitle with discipline and semester.

Activity cards: name ("Lista 1 — Recursão"), type tag ("Atividade", "Trabalho" or "Prova"), complexity with text and a 3-level icon ("Complexidade média"), one deadline line ("Prazo final: 15/10 às 23:59"), and a status badge (icon + text). Show 4 cards covering these statuses: "Pendente" (white with navy outline, clock icon), "Entregue" (navy tint, check icon), "Entregue com atraso" (light red tint, red text, alert icon), "Concluída · nota 9,5" (light green, seal icon).

Make two variants of this screen:
1) ALUNO: cards tap through to the activity detail; no create button.
2) PROFESSOR: primary button "Nova atividade"; cards have a secondary button "Ver entregas" and no student status badge and no submission counts.

Empty state: "Nenhuma atividade por aqui ainda." (teacher variant adds the button "Nova atividade").

Generate the mobile version of both variants.
```
Desktop: *"Now create desktop versions: sidebar on the left; the activities as a table with columns Nome, Tipo, Complexidade, Prazo final, Estado (student) or Entregas (teacher)."*

## Tela 5 — Nova atividade (RF10)

```
Screen: bottom sheet (mobile, full height) / modal (desktop) "Nova atividade" for the PROFESSOR.

Fields, in this order, labels always visible: "Nome da atividade*"; "Descrição" (multiline); "Tipo*" segmented control with "Atividade", "Trabalho", "Prova"; "Complexidade*" segmented control with "Baixa", "Média", "Alta"; "Modalidade" segmented control with "Individual" and "Em grupo" (when "Em grupo" is chosen, show a note: "Grupos ainda não estão disponíveis; os alunos entregarão individualmente."); "Disponível em" (date and time, default: agora); "Prazo final*" (date and time).

Show an inline validation error on dates: "O prazo final não pode ser antes de quando a atividade fica disponível." Primary button "Cadastrar atividade", secondary "Cancelar". Required fields marked with an asterisk and the legend "* obrigatório". Sticky action bar at the bottom on mobile.

Generate the mobile version.
```
Desktop: *"Now create the desktop modal version, two columns for the date fields."*

## Tela 6 — Minhas atividades, todas as turmas (RF05)

```
Screen: "Atividades" for the ALUNO, listing activities from ALL of the student's classes. Bottom bar with "Atividades" active.

Title "Minhas atividades". Right under it a horizontally scrollable row of filter chips, grouped with small group labels: "Estado" (Pendente, Entregue, Entregue com atraso, Concluída, Atrasada), "Tipo" (Atividade, Trabalho, Prova), "Modalidade" (Individual, Em grupo), "Complexidade" (Baixa, Média, Alta), "Turma" (one chip per class). Active chip = navy background, white text, check icon; inactive = light navy tint with navy text. Multiple chips can be active. Next to the chips, a sort control "Ordenar: Prazo ↑" that opens options "Prazo (mais próximo primeiro)", "Prazo (mais distante primeiro)", "Complexidade (maior primeiro)", "Complexidade (menor primeiro)". A "Limpar filtros" text button appears when any filter is active.

Below, activity cards (same as the class activities screen) but each also shows the class name. Show 5 cards sorted by nearest deadline, including one "Atrasada" (solid red badge, white text, alert icon) and one "Entregue com atraso".

Also show: the filtered-empty state "Nenhuma atividade com esses filtros." with "Limpar filtros"; the loading skeleton; the error state with "Tentar de novo".

Generate the mobile version.
```
Desktop: *"Now create the desktop version: sidebar, the chip groups laid out in wrapped rows above a table with columns Atividade, Turma, Tipo, Complexidade, Prazo final, Estado; sortable column headers for Prazo final and Complexidade."*

## Tela 7 — Entregas da atividade + Avaliar (RF16, RF15)

```
Screen for the PROFESSOR: submissions of one activity ("Lista 1 — Recursão", class "Turma A — Algoritmos"). Header with back arrow "Atividades". Summary line: "12 entregas · 2 com atraso · 5 avaliadas".

Mobile: one card per student: student name, file name with file icon ("lista1_maria.pdf"), "Enviada em 14/10 às 21:40", badge "No prazo" (navy tint, check icon) or "Com atraso" (light red tint, red text, alert icon), grade ("Nota 9,5" or "Sem nota"), and two buttons: secondary "Baixar arquivo" (download icon) and primary "Avaliar".
Desktop: a table with columns Aluno, Arquivo, Enviada em, Situação, Nota, Ações (Baixar arquivo, Avaliar).

Also show the "Avaliar" bottom sheet / modal: student name and file name on top, field "Nota (0 a 10)" accepting a comma (e.g. 9,5), error "A nota deve estar entre 0 e 10.", multiline field "Comentário privado" with helper "Só o aluno vê este comentário.", primary button "Salvar avaliação", success message "Avaliação salva.". Empty state: "Nenhum aluno entregou ainda."

Generate the mobile version.
```
Desktop: *"Now create the desktop version with sidebar and the table, and the Avaliar modal centered."*

## Tela 8 — Detalhe da atividade + Enviar arquivo (RF04)

```
Screen for the ALUNO: one activity's detail. Header with back arrow. Title "Lista 1 — Recursão", class name, tags "Atividade" and "Complexidade média", status badge. Section "Descrição" with a paragraph. Section "Prazo": only "Prazo final: 15/10 às 23:59", with a note in light red tint when overdue: "O prazo final passou. Você ainda pode enviar, mas a entrega será marcada com atraso."

Section "Sua entrega" with three states shown as separate frames:
1) Not delivered: dashed drop area "Escolher arquivo" ("PDF, apresentação ou texto") and primary button "Enviar entrega" disabled until a file is chosen; after choosing, show file name, size and a "Remover" link.
2) Delivered: file name, "Enviada em 14/10 às 21:40", badge "Entregue", secondary button "Enviar outro arquivo" with helper "O novo arquivo substitui o anterior."
3) Graded: badge "Concluída", "Nota 9,5", and a box "Comentário do professor" with the private comment.
Also an upload error: "Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto." and an upload-in-progress state with a progress bar and the button disabled (no double submit).

Generate the mobile version.
```
Desktop: *"Now create the desktop version: sidebar, content in a centered column 720px wide, 'Sua entrega' in a card on the right on very wide screens."*

---

## Antes de gerar, confirme

- Se o Stitch pedir logo, **não envie** o brasão da UFRPE (veja DESIGN.md §10).
- Mantenha os textos em português exatamente como estão nos prompts; eles já seguem o glossário do projeto.
- Depois de gerar, confira por tela: (1) amarelo nunca como cor de texto/ícone sobre branco; (2) vermelho só em atraso/erro; (3) nenhum elemento fora do P1 (nível, média, frequência, calendário); (4) todos os selos têm ícone e texto.

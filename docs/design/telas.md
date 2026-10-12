# Telas do P1 — especificação (como está implementado)

Cada tela, de cima para baixo, com os dados da API e os estados. Vale junto com [`../DESIGN.md`](../DESIGN.md) (tokens, componentes, estados de tela) e [`plano-de-design.md`](plano-de-design.md) (decisões). As imagens em [`referencia/`](referencia/) mostram o layout aproximado **e contêm conteúdo errado**: onde a imagem e este arquivo divergem, vale este arquivo. O código está em `front/src/features/` (uma pasta por área) e os testes de cada tela ficam ao lado dela.

Convenções: mobile primeiro; "desktop" descreve só o que muda a partir de 1024 px. Textos em português, exatamente como aqui. Os `operationId` entre colchetes são do `docs/openapi.yaml`.

**Comportamentos de todas as telas**
- O título do documento muda por tela ("Minhas turmas · Rural Sala de Aula"). A cada troca de tela o foco vai para o conteúdo (leitores de tela percebem a navegação) e há o link "Pular para o conteúdo".
- Datas: `15/10 às 23:59` (com o ano só se for outro ano), no fuso do navegador. Notas: `9,5`, `8,0`. Nomes nunca são cortados com reticências.
- Botões são verbo + objeto ("Cadastrar turma", "Entrar em turma", "Enviar entrega").
- Uma só ação primária por tela: no estado vazio ela fica no aviso, não repetida no topo.
- Movimento reduzido (`prefers-reduced-motion`) desliga animações. A interface é só no tema claro.
- Sem rolagem horizontal a 320 px (reflow, WCAG 1.4.10), conferido nas telas principais.

---

## T1 — Entrar / Criar conta (RF01) · `referencia/01-autenticacao.png`

Pública, sem cabeçalho de navegação. Se já logado, vai para `/turmas` (ou para a tela que a pessoa tentou abrir).

1. Marca (capelo provisório + "Rural Sala de Aula") e "Ambiente Virtual de Aprendizagem".
2. Abas "Entrar" e "Criar conta".
3. **Entrar:** E-mail, Senha (mostrar/ocultar), botão "Entrar" [`login`]. Erro 401: faixa "E-mail ou senha incorretos. Confira e tente de novo." O que foi digitado fica.
4. **Criar conta:** Nome, E-mail, Senha ("Mínimo de 8 caracteres"), "Eu sou": cartões "Aluno" ("Entro em turmas e entrego atividades") e "Professor" ("Crio turmas e avalio entregas"), nada pré-marcado. "Criar conta" [`register`] já entra logada. Erros: 409 no campo de e-mail ("Esse e-mail já está cadastrado. Entre ou use outro e-mail."), 422 por campo.
5. Validação no campo ao sair dele; o botão desabilita enquanto envia ("Entrando…").

Desktop: cartão central de 448 px.

## T2 — Turmas do aluno (RF02, RF03) · `referencia/02-turmas-aluno.png`

Rota `/turmas`, papel ALUNO. Barra inferior: Turmas · Atividades.

1. Cabeçalho: marca e avatar (menu: nome, papel, "Sair" [`logout`]).
2. "Minhas turmas" e o botão "Entrar em turma".
3. Seletor "Semestre 2026.2" (padrão: o mais recente; opção "Todos os semestres") e o selo "N turmas inscritas".
4. **Card de turma** [`listTurmas`]: nome, semestre, disciplina, "Prof. Marcos Silva", "Seg · Qua", selo amarelo "N pendentes" e, se houver, vermelho "N atrasadas"; "Em dia" quando os dois são 0; botão "Ver atividades" → T4.
5. **Folha "Entrar em turma"** [`enrollTurma`]: "Código da turma" (maiúsculas e espaços ignorados; "Peça o código ao professor"), "Entrar na turma". Erros no campo: 404 "Não encontramos uma turma com esse código. Confira com o professor." e 409 "Você já está nesta turma." Sucesso: fecha, mostra "Você entrou em …" e já exibe o semestre da turma.

Vazio: "Você ainda não está em nenhuma turma. Peça o código ao professor e entre." + "Entrar em turma". Erro: "Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo." + "Tentar de novo". Carregando: esqueleto.

Desktop: links no cabeçalho (Turmas, Atividades), cards em colunas por largura mínima (20 rem), folha vira modal.

## T3 — Turmas do professor (RF09) · `referencia/03-turmas-professor.png`

Rota `/turmas`, papel PROFESSOR. Sem barra inferior no celular.

1. "Minhas turmas" e o botão **"Cadastrar turma"**; seletor de semestre e "N turmas".
2. **Card de turma**: nome, semestre, disciplina, "Seg · Qua", bloco "Código de inscrição" (fonte monoespaçada) com "Copiar código" (aviso "Código copiado"), botão "Ver atividades" → T5.
3. **Folha "Nova turma"** [`createTurma`]: "Nome da turma", "Disciplina", "Semestre" (já vem com o semestre corrente; "Formato: 2026.1 ou 2026.2"), "Dias de aula" (Seg…Dom, multisseleção com ícone de marcado; ao menos um). **Sem campo de código** (o servidor gera). Botão "Cadastrar turma". Sucesso: "Turma criada. Código de inscrição: ABC123" com "Copiar código" e "Concluir"; a lista passa a mostrar o semestre da nova turma.

Vazio: "Você ainda não criou turmas." + "Cadastrar turma".

## T4 — Atividades da turma, aluno (RF05) · `referencia/04-atividades-turma-aluno.png`

Rota `/turmas/:id`, papel ALUNO. Turma que não é dele: "Turma não encontrada." + "Voltar para Turmas".

1. Link "← Turmas" e o cartão da turma: nome, "disciplina · semestre", "Prof. …", "Seg · Qua".
2. "Atividades" com a contagem [`listAtividades`], os chips de filtro e "Ordenar por" (rótulo visível).
3. **Card de atividade** (o card inteiro é o link para T8): chip do tipo (neutro), selo de estado (ícone + texto; Concluída mostra "· nota 9,5"), nome, complexidade (3 barras azuis + texto), **uma só data**: "Prazo final: 15/10 às 23:59", e o apoio: "Restam 2 dias" / "Prazo final hoje" / "Prazo final passou há 1 dia" / "Aguardando avaliação" / "Enviada depois do prazo final" / "Nota e comentário disponíveis".
4. Filtros: Estado, Tipo, Modalidade, Complexidade (um chip ativo por grupo; clicar no ativo desliga; grupos se combinam). "Limpar filtros" aparece com filtro ativo. Sem resultado: "Nenhuma atividade com esses filtros." + "Limpar filtros".

Vazio: "Nenhuma atividade por aqui ainda."

## T5 — Atividades da turma, professor (RF10) · `referencia/05-atividades-turma-professor.png`

Rota `/turmas/:id`, papel PROFESSOR (só a própria turma).

1. Link "← Turmas"; cartão da turma com o código de inscrição e "Copiar código".
2. "Atividades" com a contagem e o botão **"Cadastrar atividade"**; chips (sem o grupo Estado) e "Ordenar por".
3. Lista com **todas** as atividades, inclusive as ainda não disponíveis (chip "Disponível a partir de 20/10"). Card: tipo, "Em grupo" se for o caso, nome, complexidade, "Prazo final: …", botão "Ver entregas" → T7. Sem selo de estado.
4. **Folha "Nova atividade"** · `referencia/06-nova-atividade.png` [`createAtividade`]: "Nome da atividade*", "Descrição", "Tipo*" (Atividade, Trabalho, Prova), "Complexidade*" (Baixa, Média, Alta), "Modalidade" (Individual, Em grupo; com "Em grupo": "Grupos ainda não estão disponíveis; os alunos entregarão individualmente."), "Disponível em" (padrão: agora), "Prazo final*". Já abre com Atividade, Média e Individual. Erro de datas: "O prazo final não pode ser antes de quando a atividade fica disponível." O botão "Cadastrar atividade" abre a **confirmação** ("Confira antes de cadastrar. Nesta versão, depois de cadastrada a atividade não pode ser editada.") com o resumo e as datas; "Voltar e editar" mantém o que foi digitado e "Confirmar e cadastrar" salva ("Atividade cadastrada"). **Não há** "Data de entrega".

Vazio: "Nenhuma atividade por aqui ainda." + "Cadastrar atividade" (só no aviso).

## T6 — Minhas atividades (RF05) · `referencia/07-minhas-atividades.png`

Rota `/atividades`, papel ALUNO (professor vai para `/turmas`).

1. "Minhas atividades" e "Todas as turmas · N atividades".
2. **Chips** com rótulo de grupo: Estado (os 5), Tipo, Modalidade, Complexidade, Turma (um chip por turma). No celular rolam na horizontal com fade na borda; no desktop quebram em linhas. Nenhum vem ativo ao abrir.
3. "Ordenar por": Prazo (mais próximo/mais distante primeiro) e Complexidade (maior/menor primeiro). **Filtros e ordenação ficam guardados no navegador, por aluno.**
4. **Card** (celular): chips da turma, tipo e modalidade; nome; prazo final; apoio; selo; ação por estado: **"Enviar entrega"** (Pendente e Atrasada, primária), "Ver detalhes" (Entregue), "Ver envio" (Entregue com atraso), "Ver nota e comentário" (Concluída). Tudo leva a T8.
5. **Desktop: tabela** (Atividade, Turma, Tipo, Complexidade, Prazo final, Estado, ação) com os cabeçalhos Complexidade e Prazo final ordenáveis (`aria-sort`).

Estados: "Nenhuma atividade com esses filtros." + "Limpar filtros"; "Nenhuma atividade por aqui ainda."; erro "Não conseguimos carregar suas atividades…" + "Tentar de novo".

## T7 — Entregas da atividade, professor (RF16, RF15) · `referencia/08-entregas-professor.png`

Rota `/atividades/:id/entregas`, papel PROFESSOR (dono da turma; outro vê "Atividade não encontrada.").

1. "← Atividades"; cartão: nome da atividade, turma e o resumo calculado da lista: "4 entregas · 3 com atraso · 2 avaliadas".
2. Lista só de quem entregou, da mais antiga para a mais recente [`listEntregas`]. Item: iniciais, nome (quebra linha), selo "No prazo"/"Com atraso", arquivo (quebra entre palavras), "1,5 MB · Enviada em 29/09 às 01:14", "Nota 9,5" ou "Sem nota", botões **"Baixar"** [`downloadEntrega`, mantém o nome original] e "Avaliar"/"Editar nota". Os botões têm nome acessível completo ("Avaliar entrega de Maria…").
3. **Folha "Avaliar entrega"** [`evaluateEntrega`]: aluno e arquivo; "Nota (0 a 10)" (vírgula; até 1 casa; erros "Informe a nota.", "A nota deve estar entre 0 e 10.", "Use no máximo uma casa decimal."); "Comentário privado" ("Só o aluno vê este comentário"); "Salvar avaliação" → "Avaliação salva." Ao editar, abre com a nota e o comentário atuais.
4. Falha ao baixar: "Não foi possível baixar o arquivo. Tente de novo."

Vazio: "Nenhum aluno entregou ainda." Desktop: tabela (Aluno, Arquivo, Enviada em, Situação, Nota, ações).

## T8 — Detalhe da atividade e envio, aluno (RF04) · `referencia/09-detalhe-atividade-aluno.png`

Rota `/atividades/:id`, papel ALUNO.

1. "← Atividades" (para Minhas atividades). Cartão: chip do tipo, selo de estado, nome, "Turma A — Algoritmos · Prof. …", complexidade e "Individual"/"Em grupo".
2. Só se estiver **Atrasada**, uma faixa informativa (sem alarme duplicado): "O prazo final passou. Você ainda pode enviar, mas a entrega será marcada com atraso."
3. "Prazo": uma só data, "Prazo final: …". "Descrição", se houver.
4. **"Sua entrega"** (região nomeada), conforme `minhaEntrega` [`getAtividade`]:
   - **Sem entrega:** área tracejada "Escolher arquivo" ("PDF, apresentação ou texto, até 25 MB"; também aceita arrastar). O arquivo é conferido na hora (tipo, 25 MB, vazio) com a mesma mensagem da API; escolhido, mostra nome e tamanho com "Remover". "Enviar entrega" fica desabilitado até haver arquivo [`submitEntrega`]; enviando: "Enviando…", barra de progresso e botão desabilitado. Depois do prazo: "Ao enviar agora, a entrega será marcada com atraso." Erros da API aparecem no bloco e o arquivo escolhido é mantido.
   - **Entregue:** nome, tamanho, "Enviada em …", selo "Entregue"/"Entregue com atraso" e "Enviar outro arquivo" ("O novo arquivo substitui o anterior.").
   - **Concluída (avaliada):** "Concluída", "Nota 9,5" e a caixa "Comentário do professor"; sem reenvio ("Esta entrega já foi avaliada e não aceita novo envio.").
5. Depois de enviar, o foco vai para o título "Sua entrega" (o botão de envio some) e aparece "Entrega enviada."

Desktop: coluna central de 768 px.

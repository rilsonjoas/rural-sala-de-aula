# Telas do P1 — especificação para o front

Cada tela, de cima para baixo, com os dados da API e os estados. Vale junto com [`../DESIGN.md`](../DESIGN.md) (tokens, componentes, estados de tela) e [`plano-de-design.md`](plano-de-design.md) (decisões D1–D18). As imagens em [`referencia/`](referencia/) mostram o layout aproximado, **mas contêm conteúdo errado**: onde a imagem e este arquivo divergem, vale este arquivo.

Convenções: mobile primeiro; "desktop" descreve só o que muda a partir de 1024 px. Todos os textos em português, exatamente como escritos aqui. `operationId` entre colchetes são do `docs/openapi.yaml`.

---

## T1 — Entrar / Criar conta (RF01) · `referencia/01-autenticacao.png`

Pública. Sem cabeçalho de navegação. Se já logado, vai para `/turmas`.

1. Marca: capelo provisório + "Rural Sala de Aula"; subtítulo "Ambiente Virtual de Aprendizagem". O título não pode sobrepor o subtítulo (a imagem tem esse defeito).
2. Abas "Entrar" e "Criar conta".
3. **Entrar:** E-mail, Senha (com mostrar/ocultar), botão "Entrar" [`login`]. Erro 401: faixa vermelha "E-mail ou senha incorretos. Confira e tente de novo."
4. **Criar conta:** Nome, E-mail, Senha (ajuda "Mínimo de 8 caracteres"), "Eu sou": cartões "Aluno" ("Entro em turmas e entrego atividades") e "Professor" ("Crio turmas e avalio entregas"), nada pré-marcado. Botão "Criar conta" [`register`]; já entra logada e vai para `/turmas`. Erro 409: "Esse e-mail já está cadastrado. Entre ou use outro e-mail." Erros 422 por campo, via `Problem.campos`.
5. **Não há** "Esqueceu?", "suporte técnico" nem texto sobre login acadêmico.

Desktop: cartão central de 420 px sobre o fundo `--bg`.

## T2 — Turmas do aluno (RF02, RF03) · `referencia/02-turmas-aluno.png`

Rota `/turmas`, papel ALUNO. Barra inferior: Turmas (ativa) · Atividades.

1. Cabeçalho: marca à esquerda, avatar com iniciais à direita (menu: nome, papel, "Sair" [`logout`]). Sem seta de voltar.
2. Título "Minhas turmas".
3. Botão primário "Entrar em turma" (largura total no mobile).
4. Linha: seletor "Semestre 2026.2" (semestres das turmas do aluno; padrão = o mais recente) [`listTurmas` com `semestre`] e selo "N turmas inscritas".
5. Lista de **cards de turma** [`listTurmas`]: faixa navy de 4 px; nome ("Turma A — Algoritmos"); chip do semestre; disciplina; "Prof. Marcos Silva" (`professorNome`); "Seg · Qua" (`diasAula`); selo amarelo "N pendentes" (`atividadesPendentes`) e, se > 0, selo vermelho "N atrasadas" (`atividadesAtrasadas`); "Em dia" se os dois forem 0; botão "Ver atividades" → T4.
6. **Folha "Entrar em turma"** [`enrollTurma`]: campo "Código da turma" (maiúsculas automáticas, espaços ignorados; ajuda "Peça o código ao professor"), botão "Entrar na turma". Erros: 404 "Não encontramos uma turma com esse código. Confira com o professor."; 409 "Você já está nesta turma." Sucesso: fecha a folha, a turma aparece na lista.
7. **Não há** horário de aula, "Próxima entrega", "Tudo entregue", nem a barra "Estados de UX".

Vazio: "Você ainda não está em nenhuma turma. Peça o código ao professor e entre." + "Entrar em turma". Erro: "Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo." + "Tentar de novo".

Desktop: menu lateral (Turmas, Atividades); cards em 2–3 colunas; a folha vira modal.

## T3 — Turmas do professor (RF09) · `referencia/03-turmas-professor.png`

Rota `/turmas`, papel PROFESSOR. Sem barra inferior.

1. Cabeçalho como em T2.
2. Título "Minhas turmas"; botão primário "Nova turma".
3. Seletor "Semestre" e selo "N turmas".
4. **Card de turma:** faixa navy; nome; chip do semestre; disciplina; "Seg · Qua"; bloco "Código de inscrição" com o código em fonte monoespaçada e botão "Copiar código" (confirma "Código copiado"); botão "Ver atividades" → T5. **Não há** "38 alunos" nem horário.
5. **Folha "Nova turma"** [`createTurma`]: "Nome da turma", "Disciplina", "Semestre" (ajuda "Formato: 2026.1 ou 2026.2"), "Dias de aula" (sete chips Seg Ter Qua Qui Sex Sáb Dom, multisseleção, com ícone de marcado). **Sem campo de código** (o servidor gera). Botão "Cadastrar turma". Sucesso: mensagem "Turma criada. Código de inscrição: ABC123" com "Copiar código".

Vazio: "Você ainda não criou turmas." + "Nova turma". Desktop: igual a T2.

## T4 — Atividades da turma, aluno (RF05) · `referencia/04-atividades-turma-aluno.png`

Rota `/turmas/:id`, papel ALUNO.

1. Cabeçalho com seta de voltar ("Turmas") e título "Turma A — Algoritmos".
2. Cartão da turma: disciplina · semestre; "Prof. Marcos Silva"; "Seg · Qua".
3. Subtítulo "Atividades" com contagem [`listAtividades`].
4. Chips de filtro e ordenação (mesmo componente de T6, sem o grupo Turma).
5. **Card de atividade**: chip de tipo (neutro); selo de estado (ícone + texto); nome; complexidade (3 barras navy + texto); "Prazo final: 15/10 às 23:59"; seta; o card inteiro leva a T8. Pendente mostra "Restam N dias"; atrasada, "Prazo final passou há N dias".
6. **Não há** "Entrega: 14/10", "N atividades postadas" nem botão "Ver estado vazio".

Vazio: "Nenhuma atividade por aqui ainda."

## T5 — Atividades da turma, professor (RF10) · `referencia/05-atividades-turma-professor.png`

Rota `/turmas/:id`, papel PROFESSOR.

1. Cabeçalho com seta de voltar e título "Turma A — Algoritmos".
2. Cartão: disciplina · semestre; código de inscrição com "Copiar código"; "Seg · Qua".
3. Botão primário "Nova atividade".
4. Lista [`listAtividades`], todas as atividades (inclusive as ainda não disponíveis). Card: chip de tipo (neutro); complexidade; nome; "Prazo final: …" (sem truncar); chip "Disponível a partir de 20/10" quando for o caso; botão "Ver entregas" → T7.
5. **Folha "Nova atividade"** · `referencia/06-nova-atividade.png` [`createAtividade`]: cabeçalho "Nova atividade · Turma A" e botão fechar; "Nome da atividade*"; "Descrição"; "Tipo*" (Atividade, Trabalho, Prova); "Complexidade*" (Baixa, Média, Alta, com 1–3 pontos navy); "Modalidade" (Individual, Em grupo; ao escolher "Em grupo": "Grupos ainda não estão disponíveis; os alunos entregarão individualmente."); "Disponível em" (padrão: agora); "Prazo final*". Erro de datas: "O prazo final não pode ser antes de quando a atividade fica disponível." **Etapa de confirmação** antes de salvar: resumo com as datas e botões "Voltar e editar" / "Cadastrar atividade" (o P1 não edita atividade). Rodapé fixo com "Cadastrar atividade" e "Cancelar". **Não há** campo "Data de entrega", "Estimativa de carga" nem aviso sobre notificações.

Vazio: "Nenhuma atividade por aqui ainda." + "Nova atividade".

## T6 — Minhas atividades (RF05) · `referencia/07-minhas-atividades.png`

Rota `/atividades`, papel ALUNO (professor é redirecionado a `/turmas`).

1. Cabeçalho; título "Minhas atividades"; subtítulo "Todas as turmas · N atividades".
2. Botão "Limpar filtros" (só aparece com filtro ativo).
3. **Chips de filtro** rolando na horizontal, com rótulo de grupo: **Estado** (Pendente, Entregue, Entregue com atraso, Concluída, Atrasada), **Tipo** (Atividade, Trabalho, Prova), **Modalidade** (Individual, Em grupo), **Complexidade** (Baixa, Média, Alta), **Turma** (um chip por turma). Chip ativo: navy, texto branco, ícone de marcado; mais de um chip pode estar ativo. Nenhum vem ativo ao abrir (D17). Mapeia para os parâmetros de [`listMinhasAtividades`].
4. Seletor "Ordenar por": "Prazo (mais próximo primeiro)" (padrão), "Prazo (mais distante primeiro)", "Complexidade (maior primeiro)", "Complexidade (menor primeiro)".
5. **Card de atividade**: chip da turma ("Turma A — Algoritmos"); complexidade; chip de tipo; "Individual"/"Em grupo"; nome; "Prazo final: 15/10 às 23:59"; mensagem de apoio ("Restam 2 dias", "Prazo final passou há 1 dia", "Aguardando avaliação", "Nota e comentário disponíveis"); selo de estado; ação à direita: **"Enviar entrega"** (primário, em Pendente e Atrasada), "Ver detalhes" (Entregue), "Ver envio" (Entregue com atraso), "Ver nota e comentário" (Concluída). Toda ação leva a T8. **Não há** "Em trio", "Comprovante", "Enviado com tolerância" nem a barra "Lista/Sem resultados/Skeleton".
6. Os filtros e a ordenação ficam guardados no navegador, por usuário (D12).

Estados: "Nenhuma atividade com esses filtros." + "Limpar filtros"; sem atividades: "Nenhuma atividade por aqui ainda."; carregando e erro como em T2.

Desktop: os chips ficam em linhas abaixo do título, e a lista vira tabela (Atividade, Turma, Tipo, Complexidade, Prazo final, Estado) com cabeçalhos clicáveis em Prazo final e Complexidade.

## T7 — Entregas da atividade, professor (RF16, RF15) · `referencia/08-entregas-professor.png`

Rota `/atividades/:id/entregas`, papel PROFESSOR (dono da turma).

1. Cabeçalho com seta de voltar e título "Lista 1 — Recursão".
2. Cartão: turma ("Turma A — Algoritmos"); resumo "N entregas · N com atraso · N avaliadas" (calculado da lista) [`listEntregas`].
3. Lista por data de envio (mais antiga primeiro), só de quem entregou. Item: avatar com iniciais; nome do aluno (quebra de linha); selo "No prazo" ou "Com atraso"; arquivo com tamanho; "Enviada em 14/10 às 21:40"; "Sem nota" ou "Nota 9,5"; botões "Baixar" [`downloadEntrega`] e "Avaliar" (sem nota) ou "Editar nota" (com nota). **Não há** "Matrícula".
4. **Folha "Avaliar"** (não está desenhada na imagem) [`evaluateEntrega`]: nome do aluno e do arquivo; "Nota (0 a 10)" (até 1 casa decimal, vírgula aceita; erro "A nota deve estar entre 0 e 10."); "Comentário privado" (ajuda "Só o aluno vê este comentário"); botão "Salvar avaliação"; sucesso "Avaliação salva."

Vazio: "Nenhum aluno entregou ainda."

Desktop: tabela (Aluno, Arquivo, Enviada em, Situação, Nota, Ações) e modal centrado para "Avaliar".

## T8 — Detalhe da atividade e envio, aluno (RF04) · `referencia/09-detalhe-atividade-aluno.png`

Rota `/atividades/:id`, papel ALUNO [`getAtividade`].

1. Cabeçalho com seta de voltar e título curto da atividade.
2. Cartão: selo "Prazo expirado" (vermelho, só depois do prazo final) e chip de tipo; nome; "Turma A — Algoritmos · Prof. Marcos Silva"; complexidade (3 barras navy + texto) e "Individual"/"Em grupo".
3. Aviso em faixa vermelha, **só depois do prazo final**: "O prazo final passou. Você ainda pode enviar, mas a entrega será marcada com atraso." (sem "pelo sistema acadêmico").
4. Seção "Prazo": uma só data, "Prazo final: 15/10 às 23:59". **Não há** "Data limite regular", "Tolerância final", "Peso na média", "Código da Disciplina", "Rubrica" nem "Fórum".
5. Seção "Descrição" com o texto.
6. Seção "Sua entrega", conforme `minhaEntrega`:
   - **Sem entrega:** área tracejada "Escolher arquivo" (ajuda "PDF, apresentação ou texto, até 25 MB"); depois de escolher, nome e tamanho e link "Remover"; botão "Enviar entrega" desabilitado até haver arquivo [`submitEntrega`]. Em envio: barra de progresso e botão desabilitado (sem duplo envio). Depois do prazo final, nota "Ao enviar agora, a entrega será marcada com atraso." Erros: 413 "O arquivo passa de 25 MB. Envie um arquivo menor."; 415 "Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto."
   - **Entregue:** nome e tamanho do arquivo; "Enviada em 14/10 às 21:40"; selo "Entregue" ou "Entregue com atraso"; botão "Enviar outro arquivo" com ajuda "O novo arquivo substitui o anterior."
   - **Concluída (avaliada):** selo "Concluída"; "Nota 9,5"; caixa "Comentário do professor" com o comentário privado; **sem** botão de reenvio (409 "Esta entrega já foi avaliada e não aceita novo envio.").
7. **Não há** os botões "Simular estados", "Alternar Erro Formato" nem "Alternar Em Progresso".

Desktop: coluna central de 720 px.

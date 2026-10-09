# DESIGN.md — Rural Sala de Aula (entrega P1)

Fonte de verdade do design. Especificação das telas em [`design/telas.md`](design/telas.md); decisões e correções do material do Stitch em [`design/plano-de-design.md`](design/plano-de-design.md). Cobre **só os requisitos P1** (texto de origem em [`requisitos.md`](requisitos.md)); o que não está aqui é backlog (§9). Prompts prontos para o Stitch em [`stitch-prompts.md`](stitch-prompts.md).

## 1. Princípios

1. **Mobile-first, responsivo de verdade.** Aluno usa o celular entre aulas; professor avalia entregas, muitas vezes no desktop. Os dois layouts são projetados, não improvisados (§5).
2. **Uma tela, uma ação primária.** Aluno: "Entrar em turma". Professor: "Nova turma" / "Nova atividade".
3. **O estado pesa mais que o enfeite.** Atrasada e pendente precisam saltar aos olhos; o resto é sóbrio.
4. **Sem nada que o P1 não pede:** sem gamificação, média, frequência, créditos, sincronização, calendário, grupos, avisos ou comentários.

## 2. Identidade (UFRPE)

Cores e fonte vêm do [Manual de Identidade Visual da UFRPE](https://drupal101.ufrpe.br/sites/ufrpe.br/files/Manual%20Identidade%20UFRPE.pdf). O projeto é acadêmico e não institucional, por isso **não usa o brasão/logotipo**: a marca é o texto "Rural Sala de Aula" em azul marinho, com o capelo provisório (Lucide `GraduationCap`) ao lado até a logo própria existir. Uma logo própria entra depois do P1 (§10).

### Tokens de cor

| Token | Hex | Origem | Papel |
|---|---|---|---|
| `--navy` | `#1b2d4f` | Pantone 540 C | texto principal, cabeçalho, botão primário, faixa dos cards |
| `--red` | `#b61823` | Pantone 485 C | **só** atraso e erro |
| `--yellow` | `#f9b233` | Pantone 143 C | destaque/preenchimento (selo de contagem, chip ativo); **nunca** texto ou ícone sobre branco |
| `--bg` | `#f5f6f9` | neutro | fundo da página |
| `--surface` | `#ffffff` | neutro | cards, folhas, campos |
| `--ink-muted` | `#5b6475` | neutro | texto secundário |
| `--navy-tint` | `#e8edf7` | neutro | fundo de chip inativo, hover |
| `--red-tint` | `#fdecee` | neutro | fundo de aviso de atraso |
| `--green` | `#1e7a46` | fora da marca | só para "Concluída/Avaliada" (a marca não tem verde) |
| `--green-tint` | `#eaf5ee` | fora da marca | fundo do selo "Concluída" |
| `--border` | `#e2e5eb` | neutro | borda de cards, campos e divisores |

Contrastes medidos (WCAG, texto normal ≥ 4,5:1):

| Par | Razão | Uso |
|---|---|---|
| navy / branco | 13,68 | texto, botão primário |
| navy / `--bg` | 12,66 | texto sobre fundo |
| navy / amarelo | 7,46 | texto dentro do selo amarelo |
| branco / vermelho | 6,68 | botão destrutivo, selo "Atrasada" |
| vermelho / `--red-tint` | 5,86 | texto de erro em faixa clara |
| `--ink-muted` / branco | 5,96 | texto secundário |
| verde / branco | 5,35 | texto "Concluída" |
| verde / `--green-tint` | 4,79 | texto do selo "Concluída" |
| **amarelo / branco** | **1,84** | **proibido** como cor de texto ou ícone |


### Tipografia

Padrão da UFRPE: Akzidenz-Grotesk (paga), alternativa Myriad Pro. Para a web: **Inter** (livre, mesma família grotesca), pesos 400/500/600/700. Escala: 12 (apoio) · 14 (corpo pequeno) · 16 (corpo; mínimo em campos, evita zoom no iOS) · 20 (título de card) · 24 (título de tela).

### Forma

Raio 12 px em cards e folhas, 8 px em campos e chips, 999 px em selos. Cards têm **borda de 1 px `--border` e nenhuma sombra**; sombra só em overlays (`0 4px 16px rgba(27,45,79,.08)`). Faixa de 4 px à esquerda dos cards de turma, sempre `--navy`: cor por turma **não existe** no schema do P1, então não se inventa.

## 3. Papéis e navegação

| | Aluno | Professor |
|---|---|---|
| Cai em | **Turmas** | **Turmas** |
| Mobile (barra inferior) | Turmas · Atividades | só Turmas (sem barra; só o cabeçalho) |
| Desktop (menu lateral) | Turmas · Atividades | Turmas |
| Ação primária | Entrar em turma | Nova turma |
| Menu do avatar | nome, papel, **Sair** | nome, papel, **Sair** |

A tela "Atividades" geral existe só para o aluno (RF05). O professor chega às atividades pela turma.

## 4. Componentes

- **Cabeçalho:** marca "Rural Sala de Aula" à esquerda, avatar com iniciais à direita (abre menu com nome, papel e Sair). Sem seletor de semestre global: semestre é atributo da turma (filtro opcional na lista de turmas, ver `design/telas.md` T2 e T3).
- **Card de turma** (aluno): faixa navy; nome da turma; disciplina; professor; dias de aula ("Seg · Qua"); selo amarelo "N pendentes" (texto navy) e, se houver, selo vermelho "N atrasadas"; "Em dia" quando os dois são 0; botão secundário "Ver atividades".
- **Card de turma** (professor): faixa navy; nome; disciplina; semestre; dias de aula; **código de inscrição** com botão "Copiar código"; botão secundário "Ver atividades".
- **Card de atividade:** nome; turma (só na lista geral); tipo em chip neutro `--navy-tint`; complexidade (3 barras navy preenchidas + texto; sem verde/vermelho); **uma única data**: "Prazo final: 15/10 às 23:59"; selo de estado (§7); modalidade só se for "Em grupo" (aviso de que grupos ainda não funcionam, §9). Pendente mostra "Restam N dias"; atrasada mostra "Prazo final passou há N dias". No professor, atividade ainda não disponível mostra o chip "Disponível a partir de 20/10".
- **Chips de filtro (RF05):** faixa horizontal rolável no topo, grupos nesta ordem: Estado · Tipo · Modalidade · Complexidade · Turma; ordenação por um seletor "Ordenar: Prazo ▲ / Complexidade ▼". Chip ativo = fundo navy, texto branco, ícone de "marcado"; inativo = `--navy-tint`. O estado do chip nunca é só cor.
- **Folha (bottom sheet no mobile, modal no desktop):** Entrar em turma, Nova turma, Nova atividade, Avaliar entrega.
- **Campo:** rótulo sempre visível acima; erro abaixo, no blur, em `--red` com texto de ação.
- **Botões:** primário (navy, texto branco), secundário (contorno navy), destrutivo/atraso (vermelho). Altura mínima 44 px.

## 5. Responsivo

| Ponto de quebra | Layout |
|---|---|
| < 640 px (mobile) | coluna única; cabeçalho fixo; barra inferior (aluno); folhas sobem de baixo; chips rolam na horizontal |
| 640–1023 px (tablet) | cards em 2 colunas; sem barra inferior, menu no cabeçalho |
| ≥ 1024 px (desktop) | menu lateral fixo (240 px); cards em 2–3 colunas; listas de atividades e entregas viram **tabela** com chips acima; folhas viram modais centrados |

A tela do professor "Entregas da atividade" é tabela no desktop (aluno, enviada em, atraso, nota, ações) e lista de cards no mobile.

## 6. Telas do P1 (ordem de construção)

| # | Tela | RF | Quem |
|---|---|---|---|
| 1 | Entrar / Criar conta (escolha de papel Aluno ou Professor) | RF01 | todos |
| 2 | Turmas do professor + folha **Nova turma** | RF09 | professor |
| 3 | Turmas do aluno + folha **Entrar em turma** (código) | RF02, RF03 | aluno |
| 4 | Atividades da turma (aluno vê; professor vê e cria) | RF10, RF05 | ambos |
| 5 | Folha **Nova atividade** | RF10 | professor |
| 6 | **Minhas atividades** (todas as turmas, com chips) | RF05 | aluno |
| 7 | Entregas da atividade + folha **Avaliar** | RF15, RF16 | professor |
| 8 | Detalhe da atividade + **Enviar arquivo** | RF04 | aluno |

As telas 7 (parte de baixar) e 8 são as últimas a serem implementadas (reunião de 08/10).

A estrutura de cada tela (campos, textos, endpoints e estados) está em [`design/telas.md`](design/telas.md). Aqui ficam só o sistema de design e as regras comuns.

## 7. Estados da atividade (RF05)

Todos derivados do **prazo final**: pendente = sem entrega e antes do prazo final; atrasada = sem entrega e depois dele; entregue com atraso = enviada depois dele. O envio nunca é bloqueado por prazo; só é bloqueado depois da avaliação.

| Estado | Selo | Cor (nunca só cor: ícone + texto) |
|---|---|---|
| Pendente | "Pendente" + ícone relógio | contorno navy, fundo branco |
| Entregue | "Entregue" + ícone check | `--navy-tint` |
| Entregue com atraso | "Entregue com atraso" + ícone alerta | `--red-tint`, texto vermelho |
| Concluída (avaliada) | "Concluída · nota 9,5" + ícone selo | fundo verde-claro |
| Atrasada | "Atrasada" + ícone alerta | fundo vermelho, texto branco |

## 8. Estados de tela (todas)

| Estado | Regra |
|---|---|
| Carregando | esqueleto no formato do card; nunca spinner solto |
| Vazio | ensina e oferece ação. Aluno sem turmas: "Você ainda não está em nenhuma turma. Peça o código ao professor e entre." + botão "Entrar em turma". Professor: "Você ainda não criou turmas." + "Nova turma". Atividades vazias: "Nenhuma atividade por aqui ainda." (professor: + "Nova atividade"). Filtro sem resultado: "Nenhuma atividade com esses filtros." + "Limpar filtros" |
| Erro | diz o que fazer: "Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo." + "Tentar de novo" |
| Sucesso | confirmação curta na tela ("Turma criada. Código: ABC123") |
| Formulário | nada some ao errar; erro no campo; submit com duplo toque não duplica |

Mensagens já definidas: entrega já avaliada → "Esta entrega já foi avaliada e não aceita novo envio."; sessão expirada → "Sua sessão expirou. Entre de novo."; código inexistente → "Não encontramos uma turma com esse código. Confira com o professor."; já inscrito → "Você já está nesta turma."; arquivo → ver §10.

## 9. Fora do P1 (não desenhar agora)

Lista completa em [`BACKLOG.md`](BACKLOG.md). Resumo:


Sair da turma, grupos (solicitar, aprovar, sair), calendário de carga semanal, editar atividade, avisos, comentários, notificações, perfil/edição de conta, recuperação de senha, tema escuro. Atividade com modalidade "Em grupo" pode ser cadastrada, mas **sem fluxo de grupo**: mostra o selo "Em grupo" e o aluno entrega individualmente até o backlog entrar.

## 10. Decisões em aberto

1. **Data de entrega no cadastro (RF10):** o documento de requisitos lista "data de entrega" entre os atributos da atividade. Decidimos que a data de entrega é a do aluno (`Entrega.enviadaEm`) e que o professor define só o prazo final. Confirmar com o Luiz e ajustar o texto do RF10.
2. **Logo própria (roadmap, fora do P1):** inspirada nos conceitos da UFRPE e não no desenho. O manual da UFRPE veda alterar símbolo e cores do logotipo, então o brasão não é usado nem derivado. Até lá, texto + capelo provisório.
3. **Contador de entregas a avaliar (professor):** fora do P1; não há campo no contrato.
4. **Fonte:** Inter está assumida; se a UFRPE exigir Akzidenz-Grotesk/Myriad Pro, trocar o token.
5. **Armazenamento dos arquivos** (ADR-0003): decisão do Luiz.

Decididas: "Concluída" = entrega avaliada pelo professor (o texto de origem não define); contador de pendentes/atrasadas e `professorNome` em `Turma`; limites de arquivo (25 MB; pdf, ppt, pptx, doc, docx, txt); cookie httpOnly; papel livre no cadastro; reenvio bloqueado após avaliação; entregas só de quem entregou; filtros lembrados no navegador. Detalhe no [plano](design/plano-de-design.md).

## Convenções de exibição

- **Datas:** `dd/MM às HH:mm`, no fuso do navegador; inclui o ano só se for diferente do atual ("15/10/2027 às 23:59").
- **Nota:** de 0 a 10 com até uma casa decimal e vírgula ("9,5", "8,0").
- **Nomes longos** (aluno, atividade, turma) quebram linha; nunca cortam com reticências.
- **Abreviações de dia:** Seg, Ter, Qua, Qui, Sex, Sáb, Dom.

## 11. Checklist de acessibilidade (alvo WCAG 2.2 AA)

- Todo botão de ícone tem rótulo; dias da semana por extenso abreviado sem colisão ("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom").
- Nenhuma informação só por cor (selos têm texto e ícone).
- Foco de teclado visível (anel navy de 2 px com 2 px de afastamento) e não encoberto pelo cabeçalho fixo.
- Alvos de toque ≥ 44 px; layout íntegro com fonte a 200%.
- Ordem do DOM = ordem visual; folhas prendem o foco e fecham com Esc.

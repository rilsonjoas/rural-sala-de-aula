# DESIGN.md — Rural Sala de Aula (entrega P1)

Fonte de verdade do design. Especificação das telas em [`design/telas.md`](design/telas.md); decisões e correções do material do Stitch em [`design/plano-de-design.md`](design/plano-de-design.md). Cobre **só os requisitos P1** (texto de origem em [`requisitos.md`](requisitos.md)); o que não está aqui é backlog (§9).

## 1. Princípios

1. **Mobile-first, responsivo de verdade.** Aluno usa o celular entre aulas; professor avalia entregas, muitas vezes no desktop. Os dois layouts são projetados, não improvisados (§5).
2. **Uma tela, uma ação primária.** Aluno: "Entrar em turma". Professor: "Cadastrar turma" / "Cadastrar atividade".
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

O papel é contextual por turma (ADR-0008): a mesma conta leciona umas turmas e cursa outras, então a navegação é uma só.

| | Todos |
|---|---|
| Cai em | **Turmas** |
| Mobile (barra inferior) e desktop (links no cabeçalho) | Turmas · Atividades |
| Ações em Turmas | Entrar em turma · Cadastrar turma |
| Menu do avatar | nome, e-mail, **Sair** |

O card de cada turma mostra o papel naquela turma (selo "Professor" ou "Aluno"). "Atividades" traz só as das turmas em que a pessoa é aluna; as atividades de uma turma que ela leciona ficam dentro da turma.

## 4. Componentes

- **Cabeçalho:** marca "Rural Sala de Aula" à esquerda, avatar com iniciais à direita (abre menu com nome, e-mail e Sair). Sem seletor de semestre global: semestre é atributo da turma (filtro opcional na lista de turmas, ver `design/telas.md` T2 e T3).
- **Card de turma** (aluno): faixa navy; nome da turma; disciplina; professor; dias de aula ("Seg · Qua"); selo "vence em breve" e "N pendentes" e, se houver, selo vermelho "N atrasadas"; "Em dia" quando não há nada; botão secundário "Ver turma". Selo "Aluno" no canto.
- **Card de turma** (professor): faixa navy; nome; disciplina; semestre; dias de aula; **código de inscrição** com botão "Copiar código"; selo "Professor"; botão secundário "Ver turma".
- **Card de atividade:** nome; turma (só na lista geral); tipo em chip neutro `--navy-tint`; **uma única data**: "Prazo final: 15/10 às 23:59"; selo de estado (§7); o tipo "Projeto em Grupo" avisa que grupos ainda não funcionam (§9). Pendente mostra "Restam N dias"; atrasada mostra "Prazo final passou há N dias". No professor, atividade ainda não disponível mostra o chip "A partir de 20/10".
- **Chips de filtro (RF05):** faixa horizontal rolável no topo, grupos nesta ordem: Estado · Tipo · Turma (na turma do professor, sem Estado e sem Turma); ordenação por prazo, mais próximo ou mais distante primeiro. Chip ativo = fundo navy, texto branco, ícone de "marcado"; inativo = `--navy-tint`. O estado do chip nunca é só cor.
- **Folha (bottom sheet no mobile, modal no desktop):** Entrar em turma, Nova turma, Nova atividade, Avaliar entrega.
- **Campo:** rótulo sempre visível acima; erro abaixo, no blur, em `--red` com texto de ação.
- **Botões:** primário (navy, texto branco), secundário (contorno navy), destrutivo/atraso (vermelho). Altura mínima 44 px.

## 5. Responsivo

| Ponto de quebra | Layout |
|---|---|
| < 640 px (mobile) | coluna única; cabeçalho fixo; barra inferior (aluno); folhas sobem de baixo; chips rolam na horizontal |
| 640–1023 px (tablet) | cards em 2 colunas; mesma barra inferior do mobile (uma só navegação, que vira links no cabeçalho a partir de 1024 px) |
| ≥ 1024 px (desktop) | links no cabeçalho, sem coluna lateral; cards de turma em colunas por largura mínima (20 rem); "Minhas atividades" e as entregas viram **tabela** (as atividades de uma turma ficam em cards de 2 colunas); folhas viram modais centrados |

A tela do professor "Entregas da atividade" é tabela no desktop (aluno, enviada em, atraso, nota, ações) e lista de cards no mobile.

## 6. Telas do P1 (ordem de construção)

| # | Tela | RF | Quem |
|---|---|---|---|
| 1 | Entrar / Criar conta (nome, e-mail, senha, data de nascimento opcional) | RF01 | todos |
| 2 | **Minhas turmas** (que leciona e que cursa) + folhas **Nova turma** ("Cadastrar turma") e **Entrar em turma** (código) | RF09, RF02, RF03 | todos |
| 3 | Turma: abas **Mural** (avisos e comentários, RF13, RF14) e **Atividades** (quem cursa vê e entrega; quem leciona vê e cria) | RF10, RF05 | todos |
| 4 | Folha **Nova atividade** (botão "Cadastrar atividade") | RF10 | quem leciona |
| 5 | **Minhas atividades** (turmas que cursa, com chips) | RF05 | todos |
| 6 | Entregas da atividade + folha **Avaliar** | RF15, RF16 | quem leciona |
| 7 | Detalhe da atividade + **Enviar arquivo** | RF04 | quem cursa |

As telas 7 (parte de baixar) e 8 são as últimas a serem implementadas (reunião de 08/10).

A estrutura de cada tela (campos, textos, endpoints e estados) está em [`design/telas.md`](design/telas.md). Aqui ficam só o sistema de design e as regras comuns.

## 7. Estados da atividade (RF05)

Todos derivados do **prazo final**: pendente = sem entrega e antes do prazo final; atrasada = sem entrega e depois dele; entregue com atraso = enviada depois dele. Por padrão o envio não é bloqueado por prazo (`aceitaAtraso` ligado); o professor pode desligar a opção na atividade, e então o envio depois do prazo final é recusado (403). Depois da avaliação o reenvio é sempre bloqueado.

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


Sair da turma, grupos (solicitar, aprovar, sair), calendário de carga semanal, editar atividade, notificações, perfil/edição de conta, recuperação de senha, tema escuro. Atividade do tipo "Projeto em grupo" pode ser cadastrada, mas **sem fluxo de grupo**: mostra o selo "Em grupo" e o aluno entrega individualmente até o backlog entrar.

## 10. Decisões em aberto

1. **Data de entrega no cadastro (RF10):** o documento de requisitos lista "data de entrega" entre os atributos da atividade. Decidimos que a data de entrega é a do aluno (`Entrega.enviadaEm`) e que o professor define só o prazo final. Confirmar com o Luiz e ajustar o texto do RF10.
2. **Logo própria (roadmap, fora do P1):** inspirada nos conceitos da UFRPE e não no desenho. O manual da UFRPE veda alterar símbolo e cores do logotipo, então o brasão não é usado nem derivado. Até lá, texto + capelo provisório.
3. **Contador de entregas a avaliar (professor):** fora do P1; não há campo no contrato.
4. **Fonte:** Inter está assumida; se a UFRPE exigir Akzidenz-Grotesk/Myriad Pro, trocar o token.
5. **Armazenamento dos arquivos** (ADR-0003): decisão do Luiz.

Decididas: "Concluída" = entrega avaliada pelo professor (o texto de origem não define); contador de pendentes/atrasadas e `professorNome` em `Turma`; limites de arquivo (25 MB; pdf, ppt, pptx, doc, docx, txt); cookie httpOnly; papel contextual por turma (ADR-0008); reenvio bloqueado após avaliação; entregas só de quem entregou; filtros lembrados no navegador. Detalhe no [plano](design/plano-de-design.md).

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

## 12. Revisão de qualidade e ética (09/10/2026)

Feita com os checklists do cofre (`qualidade-de-interface` e `revisao-de-interface-etica`), mais auditoria automática (axe, WCAG 2.2 A e AA, `front/e2e/acessibilidade.spec.ts`) em todas as telas e estados, no celular (360 px) e no desktop (1280 px).

**Resultado da auditoria automática:** uma violação real (contraste da aba inativa "Criar conta"), corrigida; o resto passou. O axe não prova conformidade (não avalia a qualidade dos rótulos nem a ordem de foco): por isso a revisão manual abaixo e o teste em aparelho real, que ainda falta.

**Ajustes feitos na revisão**
- Botões seguem verbo + objeto: "Nova turma/atividade" no topo viraram "Cadastrar turma/atividade" (as folhas continuam se chamando "Nova turma" e "Nova atividade").
- Um só alarme por fato: a atividade atrasada tem o selo "Atrasada" e uma faixa informativa; saiu o selo "Prazo expirado", que repetia o aviso, e a faixa deixou de ser `role="alert"`.
- Uma só ação primária por tela: no estado vazio o botão fica só no aviso.
- Foco e leitura: título do documento por tela, foco no conteúdo a cada troca de tela, foco em "Sua entrega" depois do envio (o botão some), "Ordenar por" com rótulo visível, `scroll-padding` para o cabeçalho e a barra fixos não cobrirem o elemento focado.
- Acabamento: nomes de arquivo quebram entre palavras, selos não quebram linha, chips de filtro quebram linha no desktop e têm fade na borda no celular, `prefers-reduced-motion`, tema claro fixo.
- Reflow: sem rolagem horizontal a 320 px nas telas principais.

**Revisão ética (números e decisões que movem a pessoa)**
- Todo número na tela é fato calculado agora: contadores de turmas, "N pendentes/atrasadas" (vêm da API), "Restam N dias" (do prazo real), resumo das entregas (da lista).
- "Atrasada" é verdade por definição (sem entrega depois do prazo final), mas o sistema só sabe do que foi enviado por ele. O texto não acusa: diz o que fazer ("Você ainda pode enviar"). Se a escola aceitar entrega fora do sistema, isso precisa de uma forma de o professor marcar como entregue (backlog).
- Não há anúncio, upsell, contador de sequência, notificação de cobrança nem prazo artificial. Nada vem pré-marcado no cadastro. Os padrões da folha Nova atividade (Atividade, Média, Individual) são do próprio professor e passam por uma etapa de confirmação com o resumo.
- Dados pessoais (nome, e-mail): o cadastro não tem aviso de privacidade. Decidido não fazer, por ser um projeto universitário (ver `BACKLOG.md`).

**Desvios assumidos:** nenhum botão do P1 desvia da regra; o "Baixar" do professor é só verbo, com o objeto no nome acessível ("Baixar arquivo de Maria…").

## 13. Urgência de prazo (12/10/2026)

Só apresentação, calculada no front a partir de `prazoFinal` (`front/src/lib/urgencia.ts`). Não entra no estado da atividade (ADR-0005) nem no contrato.

| Quem | Quando | Selo | Cor |
|---|---|---|---|
| Aluno | PENDENTE e faltam 48 h ou menos | "Vence em breve" (no lugar de "Pendente"), faixa lateral no card | âmbar (`--highlight`), texto azul-escuro (7,3:1) |
| Aluno | ATRASADA | "Atrasada", faixa lateral no card | vermelho sólido |
| Professor | prazo da atividade em 48 h ou menos | "Vence em breve" | âmbar |
| Professor | prazo já passou | "Prazo encerrado" | cinza, sem alarme (para ele não é problema) |

O âmbar é reservado para o prazo: "N pendentes" e o contador de turmas passaram para o azul neutro. Sempre ícone e texto, nunca só cor.

**Ajustes de 12/10/2026 (mesma rodada)**
- Navegação: a coluna lateral saiu. No desktop os links (Turmas, Atividades) ficam no cabeçalho, alinhados ao corpo (`max-w-7xl`); no celular continua a barra inferior só para o aluno. É o mesmo elemento `nav`, que no celular fica `fixed` na borda de baixo.
- Cards de turma do aluno: selo âmbar "N vence(m) em breve" ao lado de "N atrasada" e "N pendente". Os prazos vêm de `GET /atividades` (a consulta de Minhas atividades, uma requisição para todos os cards); "pendente" conta só as que não vencem em breve, para não somar a mesma atividade duas vezes.
- Atividade do professor: selo "N a avaliar" (entregas sem nota) ao lado do selo de prazo; usa `GET /atividades/{id}/entregas`, a mesma consulta da tela de entregas. São N requisições por tela de turma (uma por atividade). Se pesar, o certo é um campo de contagem na API.
- Botão Voltar (celular e navegador): a folha empurra uma entrada no histórico ao abrir; Voltar fecha a folha em vez de sair da tela. Fechar por X, Esc ou envio desfaz a entrada, a menos que a pessoa já tenha navegado.
- Verificado com simulação de daltonismo (acromatopsia e deuteranopia): "Atrasada" e "Vence em breve" se separam pela luminosidade, pelo ícone e pelo texto.

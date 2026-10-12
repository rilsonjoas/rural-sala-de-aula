# Plano de design — Rural Sala de Aula (P1)

Reconcilia o que o Stitch gerou com o que o P1 exige. Sistema de design: [`../DESIGN.md`](../DESIGN.md). Especificação de cada tela: [`telas.md`](telas.md). Imagens de referência do Stitch (só layout): `referencia/`. O zip, os HTMLs e o `DESIGN.md` do Stitch foram apagados em 08/10/2026 depois de extraídos tokens e estrutura.

## 1. Veredito sobre o material do Stitch

**Aproveitável como base visual e de estrutura.** O Stitch seguiu a paleta, a regra do amarelo e a tipografia pedidas, e todas as telas do P1 existem em versão mobile. O código usa Tailwind com os tokens num `tailwind.config`, o que facilita a conversão para o front.

**Não aproveitável como está**, por cinco motivos:

1. **Conteúdo inventado e de outra universidade.** Aparecem "UFRRJ", "SIGAA", "Matrícula", "Semestre 2024.2", "Peso na média bimestral", "Fórum da Turma", "Código da Disciplina", "Esqueceu?", "Em trio", "Comprovante" e contagens de alunos.
2. **Cromo de protótipo em toda tela.** Barras de "Estados de UX", "Modo de Demonstração", "Simular estados" e botões de alternar erro. Servem para apresentar, não existem no produto.
3. **Só mobile.** Nenhuma tela tem layout desktop (não há `md:`/`lg:` nem `<table>` no código).
4. **Quebra de regra de cor.** Complexidade usa verde/amarelo/vermelho e o tipo "Trabalho" usa verde. Vermelho é só atraso e erro; verde é só Concluída.
5. **Dados que o contrato não tem** (§4).

## 2. Decisões de design

| # | Decisão |
|---|---|
| D1 | O Stitch foi só **referência**: as telas são reescritas em React + shadcn/ui a partir de `telas.md` e do `DESIGN.md`. O código e o zip do Stitch foram apagados. |
| D2 | Cards usam **borda 1 px `#e2e5eb`, sem sombra** (padrão do Stitch). Sombra só em overlays. Atualiza o DESIGN.md. |
| D3 | **Complexidade** = 3 barras navy preenchidas (1, 2 ou 3) + texto. Sem verde/vermelho. |
| D4 | **Tipo** (Atividade/Trabalho/Prova) = chip neutro `--navy-tint`, igual para os três. |
| D5 | Telas de topo (Turmas, Atividades, Entrar) **não têm seta de voltar**; só telas de detalhe. |
| D6 | O **avatar abre um menu** (nome, papel, Sair). O Stitch não desenhou. |
| D7 | Desktop: gerar só 3 telas no Stitch (§6); o resto segue a regra responsiva do DESIGN.md §5. |
| D8 | Mantemos o "Em grupo" cadastrável, sem fluxo de grupo (aviso já desenhado na Nova atividade). |
| D9 | **A atividade tem um só prazo: o `prazoFinal`**, definido pelo professor. Depois dele, entrega ou falta de entrega conta como atraso; o envio nunca é bloqueado. **Data de entrega = a do aluno** (`Entrega.enviadaEm`). O campo "data de entrega" saiu do cadastro de atividade (confirmar com o Luiz, pois o RF10 do documento o lista). Ordenar por prazo usa `prazoFinal`. |
| D10 | **Sem edição de atividade no P1** (RF11 é backlog): a folha Nova atividade mostra um resumo das datas e pede confirmação antes de salvar. |
| D11 | **Código da turma gerado pelo servidor**; o formulário Nova turma não tem campo de código. |
| D12 | **Filtros e ordenação do aluno lembrados no `localStorage`**, uma chave por usuário (`filtros:<userId>`); sem endpoint novo. |
| D13 | Cadastro com papel **livre** no P1 (risco registrado; convite no backlog). |
| D14 | **Reenvio bloqueado após avaliação**: o botão "Enviar outro arquivo" some na entrega Concluída e o back responde 409. |
| D15 | Entregas do professor listam **só quem entregou**; vazio = "Nenhum aluno entregou ainda." |
| D16 | Card de turma do aluno tem dois selos: amarelo "N pendentes" e vermelho "N atrasadas" (só aparece se N > 0); "Em dia" quando os dois são 0. Remove "Tudo entregue" e "Próxima entrega". |
| D17 | "Minhas atividades" abre com **todas**, `prazoFinal` mais próximo primeiro; o chip "Pendente" não vem ativo por padrão. |
| D18 | Cabeçalho usa texto + capelo provisório (Lucide `GraduationCap`) até a logo própria sair. |
| D19 | Uma só navegação adaptável: barra inferior até 1023 px (só para o aluno; o professor tem um item e fica só com o cabeçalho) e menu lateral de 240 px a partir de 1024 px. |
| D20 | Botões no topo: "Cadastrar turma" e "Cadastrar atividade" (verbo + objeto). As folhas mantêm "Nova turma" e "Nova atividade". |
| D21 | Atividade atrasada: selo "Atrasada" + faixa informativa sem `role="alert"`; o selo "Prazo expirado" saiu (alarme duplicado). |
| D22 | Título do documento por tela; foco no conteúdo a cada troca de tela; foco em "Sua entrega" depois do envio. |
| D23 | Estado vazio: a ação primária fica só no aviso, não repetida no topo. |
| D24 | Filtros: um chip ativo por grupo (casa com os parâmetros únicos da API); grupos se combinam; clicar no ativo desliga. |
| D25 | Tabela só em "Minhas atividades" e nas entregas; as atividades de uma turma ficam em cards de 2 colunas no desktop. |

## 3. Correções por tela

Legenda: **remover** = conteúdo fora do P1 ou inventado; **trocar** = existe mas está errado.

| Tela (imagem em `referencia/`) | Remover | Trocar / acrescentar |
|---|---|---|
| Autenticação (`01-autenticacao.png`) | "Esqueceu?", link "suporte técnico", texto sobre "login acadêmico" | Mostrar a aba **Criar conta** (Nome, E-mail, Senha, "Eu sou" Aluno/Professor); sem seta de voltar |
| Turmas do professor (`03-turmas-professor.png`) | barra "Visualizar estado da tela"; "38 alunos"; horário "08:00–10:00" (o schema só tem dias) | Seta de voltar sai; "Copiar" vira "Copiar código"; folha **Nova turma** com Dias de aula (já existe); botão Sair no menu do avatar |
| Turmas do aluno (`02-turmas-aluno.png`) | barra "Estados de UX"; horário; "Próxima entrega: Sex"; "Tudo entregue" | Seletor de semestre mantido; folha **Entrar em turma** e estados Já inscrito/Vazio mantidos; selos "N pendentes" (amarelo) e "N atrasadas" (vermelho) conforme D16 |
| Atividades da turma, aluno (`04-atividades-turma-aluno.png`) | botão "Ver estado vazio"; "N atividades postadas"; a linha "Entrega: 14/10" | Só "Prazo final: …" (D9); complexidade (D3) e tipo (D4); título do cabeçalho vira "Turma A — Algoritmos" (o Stitch pôs o nome da tela); horário da turma sai |
| Atividades da turma, professor (`05-atividades-turma-professor.png`) | botão "Ver Estado Vazio"; "Semestre Atual"; "38 alunos"; rodapé "Ambiente de Gestão Docente · UFRRJ"; botão de ícone sem rótulo ao lado do título; o "+" duplicado no botão | Título passa a "Turma A — Algoritmos"; chip de tipo neutro (a Prova estava vermelha, o Trabalho verde: D4); datas sem truncar; chip "Disponível a partir de…" para atividade ainda não disponível; botão "Ver entregas" mantido |
| Nova atividade (`06-nova-atividade.png`) | bloco "Diretriz Pedagógica UFRRJ… SIGAA"; "UFRRJ" no cabeçalho; "Estimativa de carga"; campo **"Data de entrega"** (D9); pontos verde/amarelo/vermelho na Complexidade | Complexidade com 1–3 pontos navy (D3); cabeçalho "Nova atividade · Turma A" (a barra de cima não repete o nome da tela); aviso de grupos mantido; erro de datas com o texto novo; resumo de confirmação antes de salvar (D10) |
| Minhas atividades (`07-minhas-atividades.png`) | barra "Lista/Sem resultados/Skeleton"; "Em trio"; botão "Comprovante"; "Enviado com tolerância"; a linha "Entrega: 14/10"; barras de complexidade amarelas/verdes/vermelhas | "Ver parecer" vira **Ver nota e comentário**; "Enviar tarefa" vira **Enviar entrega** (também em Atrasada, pois o envio não é bloqueado); "Prazo estourado ontem!" vira "Prazo final passou há 1 dia"; modalidade só "Individual"/"Em grupo"; chips de Estado com os 5 estados; abre sem chip ativo (D17) |
| Entregas do professor (`08-entregas-professor.png`) | barra "Modo de Demonstração"; "Matrícula: …"; "WCAG 2.2 AA"; "Semestre 2024.2" | "Editar nota" e "Avaliar" mantidos; resumo "12 entregas · 2 com atraso · 5 avaliadas" mantido (calculado da lista); nomes sem reticências; **a folha Avaliar não foi desenhada**, vale a descrição de `telas.md` (T7); título do cabeçalho "Lista 1 — Recursão" |
| Detalhe da atividade, aluno (`09-detalhe-atividade-aluno.png`) | "Simular estados", "Alternar Erro/Em Progresso"; "Peso na média bimestral"; bloco "Código da Disciplina / Rubrica / Fórum"; "Procurar no celular"; "Data limite regular" e "Tolerância final" (D9); "pelo sistema acadêmico" | Uma só data, **Prazo final**; "Prazo expirado" e o aviso vermelho só aparecem depois do prazo final; "Instruções" vira **Descrição**; os 3 estados da entrega (Pendente/Enviado/Avaliado) viram o estado real vindo da API; complexidade sem verde; **os frames Enviado e Avaliado não foram desenhados**, valem os do `stitch-prompts.md` (Tela 8); "Enviar outro arquivo" some quando a entrega está Concluída (D14) |

## 4. Lacunas do contrato (OpenAPI) que as telas expõem

O front não consegue montar estas telas só com o `docs/openapi.yaml` atual. **Decididas em 08/10/2026 e já refletidas no `docs/openapi.yaml`** (o Luiz ainda precisa implementar):

| # | Lacuna | Proposta | Tela |
|---|---|---|---|
| C1 ✅ | Card de turma do aluno mostra o professor, mas `Turma` só tem `professorId` | acrescentar `professorNome` | Turmas (aluno) |
| C2 ✅ | Selos "N pendentes" e "N atrasadas" | acrescentar `atividadesPendentes` e `atividadesAtrasadas` (inteiros, só aluno) em `Turma` | Turmas (aluno) |
| C3 ✅ | Não existe "detalhe da atividade" nem "minha entrega" | `GET /atividades/{id}` retornando `Atividade` com `estado` e `minhaEntrega` (opcional) | Detalhe (aluno) |
| C4 ✅ | Lista de entregas precisa do nome do aluno e do tamanho do arquivo | acrescentar `alunoNome` e `tamanhoBytes` em `Entrega` | Entregas (professor) |
| C5 ✅ | Tamanho máximo e tipos de arquivo | 25 MB; pdf, ppt, pptx, doc, docx, txt; `submitEntrega` responde 413 (tamanho), 415 (tipo), 409 (já avaliada) | Detalhe (aluno) |
| C7 ✅ | Selo "Concluída · nota 9,5" na lista de atividades | `Atividade.nota` (só aluno, quando avaliada); `modalidade` e `disponivelEm` sempre presentes na resposta; `TurmaInput.diasAula` com `minItems: 1`; `GET /atividades` (Minhas atividades) com filtro por complexidade e turma; `POST /inscricoes` | Atividades, Turmas |
| C6 | Aluno entrega atividade "Em grupo" | decidido: entrega individualmente até grupos entrarem (**o Luiz ainda precisa confirmar**) | Detalhe (aluno) |


## 5. Mapa de rotas e papéis

| Rota | Tela | Papel | Guarda |
|---|---|---|---|
| `/entrar` | Entrar / Criar conta | público | logado → `/turmas` |
| `/turmas` | Minhas turmas | aluno, professor | exige login |
| `/turmas/:id` | Atividades da turma | aluno, professor | professor só da própria turma; aluno só se inscrito |
| `/atividades` | Minhas atividades | aluno | professor → `/turmas` |
| `/atividades/:id` | Detalhe e envio | aluno | professor → `/turmas` |
| `/atividades/:id/entregas` | Entregas e avaliação | professor | aluno → `/turmas`; só dono da turma |

Folhas/modais sem rota própria: Nova turma, Entrar em turma, Nova atividade, Avaliar. Sessão expirada (401) leva a `/entrar` com a mensagem "Sua sessão expirou. Entre de novo."; rota inexistente mostra "Página não encontrada" com botão "Voltar para Turmas".

## 6. Telas que faltam

| Item | Como resolver |
|---|---|
| Menu do avatar (D6) | desenhar no código com `DropdownMenu`; não precisa de Stitch |
| 404 e sessão expirada | texto e botão simples; sem Stitch |
| **Desktop: Minhas atividades** (tabela + chips + ordenação) | gerar no Stitch |
| **Desktop: Entregas e avaliação** (tabela + modal Avaliar) | gerar no Stitch |
| **Desktop: Turmas** com menu lateral (define o shell) | gerar no Stitch |
| Estados de carregando e erro | esqueleto no formato do card e bloco de erro com "Tentar de novo"; implementar direto |

As outras telas no desktop seguem o DESIGN.md §5 (grade de 2–3 colunas, modais centrados) sem precisar do Stitch.

## 7. Componentes (design → front)

| Componente | Base | Observação |
|---|---|---|
| `Button`, `Input`, `Label`, `Textarea`, `Select` | shadcn | altura 44–48 px; rótulo sempre visível |
| `ToggleGroup` | shadcn | Tipo, Complexidade, Modalidade, Dias de aula |
| `Tabs` | shadcn | Entrar / Criar conta |
| `Sheet` (mobile) / `Dialog` (desktop) | shadcn | um componente responsivo `ResponsiveSheet` |
| `DropdownMenu` | shadcn | menu do avatar |
| `Table` | shadcn | só ≥ 1024 px |
| `Skeleton`, `Progress`, toasts | shadcn / sonner | upload usa `Progress` |
| `StatusBadge` | custom | 5 estados: ícone + texto (DESIGN.md §7) |
| `ComplexidadeIndicator` | custom | 3 barras navy + texto (D3) |
| `TurmaCard`, `AtividadeCard` | custom | borda, sem sombra (D2) |
| `FilterChips` | custom | grupos Estado, Tipo, Modalidade, Turma + ordenação |
| `EmptyState`, `ErrorState` | custom | textos de DESIGN.md §8 |
| `FileDropzone` | custom | RF04; desabilita o botão durante o envio |

Tokens: usar os do DESIGN.md §2 como variáveis CSS do shadcn em `front/src/styles.css`, expostas ao Tailwind 4 por `@theme inline` (o projeto não tem mais `tailwind.config.ts`). Os tokens do Stitch já foram conferidos contra os nossos e não há mais nada a copiar dele.

## 8. Ordem de implementação do front (casa com o plano do P1)

**Estado em 09/10/2026: todas as etapas do P1 estão implementadas e testadas contra a API simulada (MSW).** Falta integrar com o back-end real, tela por tela, na mesma ordem (o Luiz implementa os endpoints na ordem abaixo).

| Etapa | RF | Telas | Endpoints do contrato | Estado |
|---|---|---|---|---|
| 0 | — | Fundação: tokens, shell, rotas e guardas, cliente da API, folha responsiva, estados, API simulada | `getMe` | ✅ |
| 1 | RF01 | Entrar / Criar conta | `register`, `login`, `logout`, `getMe` | ✅ |
| 2 | RF09 | Turmas do professor + Nova turma | `listTurmas`, `createTurma` | ✅ |
| 3 | RF02, RF03 | Turmas do aluno + Entrar em turma | `listTurmas`, `enrollTurma` (`POST /inscricoes`) | ✅ |
| 4 | RF10 | Atividades da turma (professor e aluno) + Nova atividade | `getTurma`, `listAtividades`, `createAtividade` | ✅ |
| 5 | RF05 | Minhas atividades (chips, ordenação, filtros lembrados, tabela) | `listMinhasAtividades` | ✅ |
| 6 | RF15, RF16 | Entregas do professor, Avaliar, baixar arquivos | `getAtividade`, `listEntregas`, `evaluateEntrega`, `downloadEntrega` | ✅ |
| 7 | RF04 | Detalhe da atividade e envio do arquivo | `getAtividade`, `submitEntrega` | ✅ |

Ordem de integração com o Luiz: auth → turmas → inscrições → atividades → Minhas atividades → entregas e avaliação → envio e download. Cada etapa troca o mock pelo endpoint real (o app liga o simulador com `VITE_API_MOCK=true`; sem isso fala com a API).

## 9. Critérios de aceite do design (para cada tela implementada)

- [ ] Nenhum texto fora do P1 nem de outra universidade (§3).
- [ ] Amarelo nunca como texto ou ícone sobre branco; vermelho só em atraso e erro; verde só em Concluída.
- [ ] Todo selo com ícone e texto; complexidade e tipo conforme D3 e D4.
- [ ] Estados de carregando, vazio, erro e sucesso implementados.
- [ ] Alvos de toque ≥ 44 px; foco visível; funciona a 200% de fonte.
- [ ] Mobile (360 px) e desktop (1280 px) conferidos.
- [ ] Rótulos de campo visíveis; erro no campo; submit sem duplicar.

## 10. Pendências que dependem de você

1. Aprovar os pedidos ao Luiz (C1 a C6) e me autorizar a refletir o que ele aceitar no `openapi.yaml`.
2. Gerar as 3 telas desktop no Stitch (§6) e mandar de novo o zip.
3. Logo própria: no roadmap, fora do P1; por ora, só o texto.

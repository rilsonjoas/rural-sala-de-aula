# Critérios de aceitação e plano de testes

Rascunho de 05/11/2026. **Revisar em grupo antes de entregar**: os critérios (CA) foram escritos a partir de `docs/requisitos.md` e do comportamento atual do sistema, e o grupo decide se estão certos. Complexidade e modalidade da atividade não entram (decisão de escopo, ver `docs/BACKLOG.md`). Grupos (RF06, RF07, RF12) têm só o front sobre API simulada; os casos valem para a API simulada e passam a valer para o back-end quando ele existir.

## 1. Como ler

- **CA** é o critério de aceitação: "Dado / Quando / Então".
- **CT** é o caso de teste que verifica o CA: entrada, ação e resultado esperado. Cada CT cita seu CA, e cada CA tem pelo menos um CT.
- **Tipo**: `Auto` (já existe teste automatizado, com o arquivo), `Manual` (plano, executado por colega) ou `Auto-API` (script `scripts/smoke-p1.py`).
- Papéis: **Professor** (quem criou a turma) e **Aluno** (quem entrou pelo código). O papel é por turma.

## 2. Critérios e casos de teste por requisito

### RF01 Cadastro e login

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-01.1 Dados válidos criam a conta e iniciam a sessão | CT-01.1 | nome, e-mail novo, senha válida | cadastrar | conta criada e usuário já logado na lista de turmas | Auto (`auth.test.tsx`) |
| CA-01.2 E-mail repetido é recusado | CT-01.2 | e-mail já cadastrado | cadastrar | erro 409 com mensagem; nenhuma conta nova | Auto-API (smoke) |
| CA-01.3 Credenciais certas entram; erradas não | CT-01.3 | e-mail e senha corretos, depois senha errada | entrar | primeiro entra; segundo mostra erro e continua na tela de entrada | Auto (`auth.test.tsx`) |
| CA-01.4 Rota privada exige sessão | CT-01.4 | sem login | abrir `/turmas` | redireciona para `/entrar` | Auto (`guards.test.tsx`) |

### RF02 Inscrever-se em turma

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-02.1 Código válido inscreve o aluno | CT-02.1 | código da turma | "Entrar em turma" | turma aparece na lista do aluno | Auto (`turmas.test.tsx`) |
| CA-02.2 Código inválido não inscreve | CT-02.2 | código inexistente | enviar | mensagem de erro; lista não muda | Auto (`turmas.test.tsx`) |
| CA-02.3 Inscrever-se de novo não duplica | CT-02.3 | código de turma onde já está | enviar | erro 409 e uma única inscrição | Auto (`turmas.test.tsx`, smoke) |

### RF03 Consultar turma e RF03b Sair da turma

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-03.1 O aluno vê as suas turmas, as do semestre mais recente primeiro | CT-03.1 | aluno inscrito em turmas de dois semestres | abrir Turmas | só o semestre mais recente; "Todos os semestres" mostra o resto | Auto (`turmas.test.tsx`) |
| CA-03.2 Sair remove a turma, mantendo entregas e notas | CT-03.2 | aluno com entrega | "Sair da turma" e confirmar | turma some da lista; entrega continua com o professor | Auto (`sair-da-turma.test.tsx`) |
| CA-03.3 O professor não sai da própria turma | CT-03.3 | dono da turma | tentar sair | erro 409 | Auto-API (smoke) |

### RF04 Entregar atividade

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-04.1 Arquivo permitido é aceito | CT-04.1 | PDF dentro do limite | enviar | entrega registrada com data e hora e estado "Entregue" | Auto (`detalhe.test.tsx`) |
| CA-04.2 Formato não permitido é recusado | CT-04.2 | arquivo `.exe` | enviar | mensagem na hora e nenhuma entrega | Auto (`detalhe.test.tsx`, `arquivo.test.ts`) |
| CA-04.3 Depois do prazo, com atraso permitido, entrega fica "com atraso" | CT-04.3 | atividade vencida com `aceitaAtraso` | enviar | estado "Entregue com atraso" | Auto-API |
| CA-04.4 Depois do prazo, sem atraso permitido, é recusada | CT-04.4 | atividade vencida sem atraso | enviar | erro 403 e nenhuma entrega | Auto-API (smoke) |

### RF05 Acessar e organizar atividades

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-05.1 Filtra por estado, tipo e turma | CT-05.1 | chip "Pendente" | ativar | só atividades pendentes | Auto (`minhas.test.tsx`) |
| CA-05.2 Ordena por prazo, nos dois sentidos | CT-05.2 | ordenar | alternar | lista na ordem do prazo pedida | Auto (`minhas.test.tsx`) |
| CA-05.3 Sem resultado, diz isso e oferece limpar | CT-05.3 | filtros sem resultado | aplicar | "Nenhuma atividade com esses filtros." e botão "Limpar filtros" | Auto (`minhas.test.tsx`) |

### RF06 e RF07 Grupos: solicitar, participar e sair (front com API simulada)

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-06.1 O aluno solicita grupo com nome e colegas e entra como integrante | CT-06.1 | nome "Time Alfa", 1 colega | "Solicitar grupo" | grupo pendente, com os dois, "Aguardando aprovação" | Auto (`grupos-aba.test.tsx`, `mocks/grupos.test.ts`) |
| CA-06.2 Pedido fora das regras é recusado com a regra | CT-06.2 | grupo com menos que o mínimo | enviar | mensagem "pelo menos 2 integrantes" | Auto (`grupos-aba.test.tsx`) |
| CA-06.3 O aluno entra em grupo aprovado com vaga, uma vez só | CT-06.3 | grupo aprovado com vaga | "Entrar" | passa a ser integrante; sem outros "Entrar" | Auto (`grupos-aba.test.tsx`) |
| CA-07.1 Sair é permitido, salvo se o grupo aprovado ficar abaixo do mínimo | CT-07.1 | grupo aprovado no mínimo | sair | erro com a regra; grupo intacto | Auto (`mocks/grupos.test.ts`) |
| CA-07.2 Sair de grupo pendente e vazio o descarta | CT-07.2 | grupo pendente de 1 pessoa | sair e confirmar | grupo some; volta a poder solicitar | Auto (`mocks/grupos.test.ts`) |

### RF08 Calendário (só quantidade de prazos)

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-08.1 A carga da semana é livre com 0 prazos, média com 1 ou 2, pesada com 3 ou mais | CT-08.1 | 0, 1, 2, 3 e 7 prazos | classificar | livre, média, média, pesada, pesada | Auto (`carga.test.ts`) |
| CA-08.2 Semana vai de segunda a domingo | CT-08.2 | prazo no domingo 23:59 e na segunda 00:00 | agrupar | cada um na sua semana | Auto (`carga.test.ts`) |
| CA-08.3 Mostra 4 semanas e navega para antes e depois | CT-08.3 | clicar "Semanas seguintes/anteriores" | navegar | janela se desloca; "Voltar para esta semana" volta | Auto (`calendario-page.test.tsx`) |
| CA-08.4 Erro de carregamento permite tentar de novo | CT-08.4 | API falha | abrir `/calendario` | alerta com "Tentar de novo" | Auto (`calendario-page.test.tsx`) |

### RF09 Cadastrar turmas

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-09.1 Turma válida é criada com código | CT-09.1 | nome, semestre `2026.2`, dias | "Cadastrar turma" | turma criada e código de inscrição exibido | Auto (`turmas.test.tsx`) |
| CA-09.2 Semestre fora do formato é recusado | CT-09.2 | semestre `2026` | enviar | erro "Use o formato 2026.1 ou 2026.2." | Auto (`turmas.test.tsx`) |

### RF10 Cadastrar atividades

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-10.1 Atividade válida é criada e vira visível na data de disponibilidade | CT-10.1 | nome, tipo, prazo, disponível em | cadastrar | criada; aluno só a vê a partir da data | Auto (`turma-page.test.tsx`) |
| CA-10.2 Prazo antes da disponibilidade é recusado | CT-10.2 | prazo < disponível em | cadastrar | erro de datas | Auto (`turma-page.test.tsx`) |
| CA-10.3 Só o professor da turma cadastra | CT-10.3 | aluno | chamar a API | 403 | Auto-API (smoke) |

### RF11 Atualizar atividades

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-11.1 Professor edita nome, descrição, tipo, datas e atraso | CT-11.1 | novo prazo | salvar | atividade atualizada na lista e no detalhe | Auto (`editar-atividade.test.tsx`) |
| CA-11.2 Edição inválida é recusada | CT-11.2 | prazo antes da disponibilidade | salvar | erro; dados antigos mantidos | Auto (`editar-atividade.test.tsx`) |

### RF12 Configurar e aprovar grupos (front com API simulada)

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-12.1 O professor define mínimo, máximo e limite de grupos | CT-12.1 | 3, 4 e 6 | "Salvar regras" | "Regras salvas." e valores gravados | Auto (`grupos-aba.test.tsx`) |
| CA-12.2 Máximo menor que o mínimo é recusado | CT-12.2 | máximo 1, mínimo 2 | salvar | mensagem do erro | Auto (`grupos-aba.test.tsx`) |
| CA-12.3 O professor aprova ou reprova solicitações, uma única vez | CT-12.3 | grupo pendente | "Aprovar" / "Reprovar" | aprovado vai para "Grupos aprovados"; segunda decisão dá 409 | Auto (`grupos-aba.test.tsx`, `mocks/grupos.test.ts`) |
| CA-12.4 Reprovado libera os alunos e não conta no limite | CT-12.4 | grupo reprovado, limite 1 | novo pedido | pedido aceito | Auto (`mocks/grupos.test.ts`) |

### RF13 Postar avisos

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-13.1 O professor publica aviso para a turma | CT-13.1 | texto | publicar | aviso aparece no topo do mural para todos | Auto (`mural.test.tsx`) |
| CA-13.2 Texto em branco é recusado | CT-13.2 | texto vazio | publicar | erro; nenhum aviso | Manual (sem teste automatizado hoje) |
| CA-13.3 Direcionar a grupos ou alunos **não** está implementado | CT-13.3 | — | — | registrado como lacuna; sem teste | Manual (anotar) |

### RF14 Comentar e responder (aviso e atividade)

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-14.1 O aluno comenta na atividade | CT-14.1 | texto | "Enviar comentário" | comentário aparece na seção "Dúvidas e comentários" | Auto (`comentarios-atividade.test.tsx`) |
| CA-14.2 O professor responde e a resposta fica sob o original | CT-14.2 | comentário do aluno | "Responder" | resposta aninhada | Auto (`comentarios-atividade.test.tsx`) |
| CA-14.3 Texto em branco desabilita o envio | CT-14.3 | espaços | digitar | botão desabilitado | Auto (`comentarios-atividade.test.tsx`) |
| CA-14.4 Quem não é da turma não comenta | CT-14.4 | usuário de fora | chamar a API | 403 ou 404 | Auto-API (smoke) |

### RF15 Avaliar entrega e RF16 Acessar e baixar entregas

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-15.1 O professor registra nota de 0 a 10 e comentário privado | CT-15.1 | nota 9,5 e comentário | salvar | aluno vê "Concluída · nota 9,5" e o comentário | Auto (`entregas.test.tsx`, `detalhe.test.tsx`) |
| CA-15.2 Nota fora de 0 a 10 é recusada | CT-15.2 | nota 11 | salvar | erro; sem nota | Auto (`entregas.test.tsx`) |
| CA-16.1 O professor lista as entregas e baixa o arquivo | CT-16.1 | atividade com entregas | abrir entregas e baixar | lista com data e hora; arquivo baixado | Auto (`entregas.test.tsx`) |
| CA-16.2 Quem entregou e quem não entregou aparecem separados | CT-16.2 | turma com 4 alunos, 3 entregas | abrir entregas | lista de quem não entregou | Auto (`sem-entrega.test.tsx`) |

### RF17 Receber notificações

| CA | CT | Entrada | Ação | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| CA-17.1 O sino mostra o número de não lidas | CT-17.1 | 3 não lidas | abrir o app | contador "3" com texto para leitor de tela | Auto (`notificacoes.test.tsx`) |
| CA-17.2 Aviso novo, atividade alterada, nota e comentário geram notificação ao destinatário certo, nunca ao autor | CT-17.2 | professor publica aviso | aluno consulta | uma notificação ao aluno; nenhuma ao professor | Auto (`mocks/notificacoes.test.ts`, smoke) |
| CA-17.3 Clicar marca como lida e leva ao destino | CT-17.3 | notificação de aviso | clicar | marcada como lida; abre a aba Mural da turma | Auto (`notificacoes.test.tsx`, `destino.test.ts`) |
| CA-17.4 Prazo próximo (48 h, não entregue) aparece sem contar como não lida | CT-17.4 | atividade que vence em 1 dia | abrir o sino | seção "Prazos próximos"; contador inalterado | Auto (`mocks/notificacoes.test.ts`) |

## 3. Quem fez o quê

Preencher com os nomes do grupo. A regra do trabalho: cada integrante escolhe **um** RF para automatizar (pelo menos 4 casos, foco em teste de unidade) e escreve os casos de dois outros RFs.

| Integrante | RF automatizado (4+ casos) | RFs com casos escritos | Quem testa (cruzado) |
|---|---|---|---|
| _nome 1_ | _a definir_ | _a definir_ | _colega que não implementou_ |
| _nome 2_ | _a definir_ | _a definir_ | _colega que não implementou_ |
| _nome 3_ | _a definir_ | _a definir_ | _colega que não implementou_ |

Sugestão para quem implementou o calendário: RF08, pois `carga.test.ts` já tem a lógica pura e cabe ampliar com mais casos de borda (mudança de mês e de ano, semana sem prazo).

## 4. Teste cruzado

Quem **não** implementou o RF executa os CT dele. Para cada execução, registrar na ferramenta de gestão (Trello): CT executado, data, resultado (passou ou falhou), evidência (print ou saída do teste) e comentários ou sugestões. Os comentários e sugestões valem como evidência.

Antes de executar, subir o ambiente: `docker compose up -d --build` (app em `http://localhost:8081`) e, para os casos `Auto`, `cd front && npm test`.

## 5. Revisão dos critérios (passo 1 do trabalho)

Antes de escrever mais testes, o grupo percorre a seção 2 e marca, em cada CA: **ok**, **ajustar** ou **faltando**. Pontos que merecem decisão do grupo: o que fazer com CA-13.3 (direcionamento de aviso, não implementado), o limiar da carga do calendário (0 / 1–2 / 3+) e as regras de saída de grupo.

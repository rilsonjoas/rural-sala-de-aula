# Comentários em atividade e notificações: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar comentário em atividade (RF14 completo) e a central de notificações com sino no app (RF17), com banco, API, front e testes.

**Architecture:** A lógica de comentário sai do `AvisoService` para um `ComentarioService` que atende aviso e atividade. Um `NotificacaoService` grava notificações dentro da transação do evento, gera "atividade nova" na leitura e calcula "prazo próximo" na hora. O front ganha um componente de comentários compartilhado e um sino no cabeçalho que consulta `GET /notificacoes` a cada 60 s.

**Tech Stack:** Spring Boot 3 / Java 21 / Postgres 16 / Flyway; React 19, TanStack Query, openapi-fetch, MSW (API simulada), Vitest, Playwright; verificação da API por `scripts/smoke-p1.py`.

**Spec:** `docs/superpowers/specs/2026-11-05-comentarios-atividade-e-notificacoes-design.md`

## Global Constraints

- Migrations Flyway em `api/src/main/resources/db/migration/`: **V4** (comentário em atividade) e **V5** (notificações). Nota: o spec diz "V4" para os dois; separei em duas para as tarefas serem independentes. Onde o spec diz "depois da V4" para a janela de "atividade nova", vale **depois da V5**.
- Contrato em `docs/openapi.yaml`; depois de editar, rodar `npm run generate:api` em `front/` (gera `src/lib/api.generated.ts`).
- Textos em português do Brasil; Lucide (`Bell`), sem emojis; texto de notificação informa, não cobra ("O prazo de X termina amanhã às 23:59.").
- Erros da API via `AppException(HttpStatus, mensagem)`; não membro da turma recebe 404 em atividade (como `obterDetalhe`); aluno só acessa atividade com `disponivelEm <= agora`.
- Texto de comentário: 1 a 3000 caracteres após `trim` (`RequestComentarioDTO` já valida).
- Notificação: `texto` até 300 caracteres; listagem corta em **50** itens gravados; prazo próximo = **48 h**, atividade disponível e não entregue; janela de "atividade nova" = **14 dias**.
- Nunca notificar o autor da própria ação; no máximo uma notificação por evento e destinatário.
- Só e-mail/push/WebSocket **não** entram. Complexidade, modalidade, grupos e calendário ficam fora.
- **Commits:** o Rilson só autoriza commit quando pede. Cada tarefa termina com um passo "Commit (somente com autorização)". Trabalhar na branch `feat/comentarios-atividade-e-notificacoes` (criar a partir de `main`).
- Observação sobre testes da API: o projeto não tem testes de integração em JUnit (só `RuralSalaDeAulaApplicationTests` e `LimitadorDeTentativasTest`); a API é verificada pelo `scripts/smoke-p1.py` contra o Docker local. Este plano segue esse padrão: o "teste que falha primeiro" da API é um bloco novo no smoke.
- Como rodar a API local: `docker compose up -d --build` na raiz e `python3 -I scripts/smoke-p1.py` (padrão `http://localhost:8081/api/v1`). Front: `npm run test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` em `front/`.

## Review Focus

Entradas que o spec implica e que mais podem dar problema; cada uma tem o teste na tarefa dona do código.

1. Atividade que ainda não abriu: aluno não lê nem comenta (404), não recebe `ATIVIDADE_NOVA` nem prazo próximo (Tarefas 2 e 4).
2. Aluno que saiu da turma (`DELETE /turmas/{id}/inscricao`): não vê mais notificações nem prazos dela (Tarefa 4).
3. Duas chamadas simultâneas a `GET /notificacoes`: sem `ATIVIDADE_NOVA` duplicada (Tarefa 4).
4. Mais de 50 notificações: a lista corta em 50, mas `naoLidas` conta todas as não lidas (Tarefa 4).
5. Marcar como lida a notificação de outro usuário: 404, e a do dono continua não lida (Tarefa 4).
6. Edição de atividade sem mudança relevante, ou comentário do professor sem pai: não notificam (Tarefa 5).
7. Entregou a atividade: o prazo próximo some; reavaliação da nota notifica de novo (Tarefas 4 e 5).

## File Structure

API (`api/src/main/java/com/narniano/rural_sala_de_aula/classes/`):
- `comentario/ComentarioService.java` (novo): criar e listar comentário de aviso e de atividade, `paraDTO`.
- `comentario/Comentario.java`, `ComentarioRepository.java`, `ResponseComentarioDTO.java` (alterar).
- `aviso/AvisoService.java` (alterar: delega a `ComentarioService`); `atividade/AtividadeController.java` (2 rotas novas).
- `notificacao/` (novo pacote): `Notificacao.java`, `TipoNotificacao.java`, `NotificacaoRepository.java`, `NotificacaoService.java`, `NotificacaoController.java`, `ResponseNotificacaoDTO.java`, `ResponseNotificacoesDTO.java`.
- Ganchos de evento: `AvisoService`, `AtividadeService`, `EntregaService`, `ComentarioService`.
- Migrations: `V4__comentario_em_atividade.sql`, `V5__notificacoes.sql`.

Front (`front/src/`):
- `features/comentarios/` (novo): `comentarios-thread.tsx` (extraído do mural), `api.ts` (hooks de atividade), `comentarios-atividade.tsx`.
- `features/avisos/mural-aba.tsx` (alterar para usar o componente extraído).
- `features/notificacoes/` (novo): `api.ts`, `sino.tsx`, `lista-notificacoes.tsx`, `destino.ts`.
- `components/shell/header.tsx` (alterar); `features/entregas/detalhe-page.tsx` e `entregas-page.tsx` (alterar); `features/atividades/turma-page.tsx` (aceitar `?aba=mural`).
- `mocks/` (alterar): `db.ts`, `domain.ts`, `handlers/{atividades,avisos,entregas,notificacoes}.ts`, `handlers/index.ts`.

Outros: `docs/openapi.yaml`, `scripts/smoke-p1.py`, `front/e2e-real/jornada-p1.spec.ts`, `README.md`, `docs/ROADMAP.md`, `docs/BACKLOG.md`.

---

### Task 1: Extrair `ComentarioService` (refactor sem mudar comportamento)

**Files:**
- Create: `api/.../classes/comentario/ComentarioService.java`
- Modify: `api/.../classes/aviso/AvisoService.java`
- Test: `scripts/smoke-p1.py` (seção "RF13/RF14", linhas ~266-288, e "RF14b", ~330-341, já cobrem o mural)

**Interfaces:**
- Produces (`ComentarioService`, `@Service`):
  - `ResponseComentarioDTO criarNoAviso(Aviso aviso, RequestComentarioDTO dto, Usuario autor)` (a regra do pai, o um nível e o `trim` hoje em `AvisoService.criarComentario`)
  - `List<ResponseComentarioDTO> listarDoAviso(UUID avisoId)`
  - `ResponseComentarioDTO paraDTO(Comentario c)`

- [ ] **Step 1: Subir a API local e rodar o smoke como linha de base**

Run: `docker compose up -d --build && python3 -I scripts/smoke-p1.py`
Expected: todas as verificações `PASS` (anotar o total, 120 em 26/10).

- [ ] **Step 2: Criar `ComentarioService` com os três métodos acima** movendo o código de `AvisoService` sem alterar mensagens nem status.

- [ ] **Step 3: Em `AvisoService`, `criarComentario`, `listarComentarios` e `listarPorTurma` passam a usar `ComentarioService`** (a validação de membro da turma continua no `AvisoService`). Remover `ComentarioRepository` e `paraDTO` do `AvisoService`.

- [ ] **Step 4: Rebuild e rodar o smoke**

Run: `docker compose up -d --build && python3 -I scripts/smoke-p1.py`
Expected: mesmo total da linha de base, 0 `FAIL`.

- [ ] **Step 5: Commit (somente com autorização)** `refactor(comentario): extrai ComentarioService do mural`

---

### Task 2: Comentário em atividade (migration V4, API e smoke)

**Files:**
- Create: `api/src/main/resources/db/migration/V4__comentario_em_atividade.sql`
- Modify: `classes/comentario/Comentario.java`, `ComentarioRepository.java`, `ResponseComentarioDTO.java`, `ComentarioService.java`; `classes/atividade/AtividadeController.java`; `docs/openapi.yaml`
- Test: `scripts/smoke-p1.py` (novo bloco depois do bloco "RF14b")

**Interfaces:**
- Consumes: `ComentarioService.paraDTO`, `criarNoAviso`, `listarDoAviso` (Task 1).
- Produces:
  - `ResponseComentarioDTO(UUID id, UUID avisoId, UUID atividadeId, UUID comentarioPaiId, UUID autorId, String autorNome, String texto, LocalDateTime horario)` (um entre `avisoId` e `atividadeId` é nulo).
  - `ComentarioService.criarNaAtividade(UUID atividadeId, RequestComentarioDTO dto, Usuario autor): ResponseComentarioDTO` e `listarDaAtividade(UUID atividadeId, Usuario usuario): List<ResponseComentarioDTO>`; ambos aplicam a regra de acesso (professor da turma, ou aluno inscrito com atividade disponível; senão `AppException(404, "Atividade não encontrada.")`).
  - `GET /api/v1/atividades/{atividadeId}/comentarios` → 200 lista; `POST` mesmo caminho com `{texto, comentarioPaiId?}` → 201. Pai de outra atividade: 422 "O comentário respondido não existe nesta atividade."
  - `ComentarioRepository.findByAtividadeIdOrderByHorarioAsc(UUID): List<Comentario>`

- [ ] **Step 1: Escrever o bloco "RF14 em atividade" no smoke** (usa `prof`, `aluno`, `intruso` e a atividade `A` do RF04). Verificações, cada uma com `check("RF14a", ...)`:
  - lista vazia de início: `GET /atividades/{A}/comentarios` → 200 e `[]`;
  - aluno comenta → 201, com `atividadeId == A` e `avisoId` nulo;
  - professor responde ao comentário do aluno → 201 e `comentarioPaiId` igual ao do aluno;
  - aluno responde à resposta do professor → 201 e o `comentarioPaiId` é o do comentário original (um nível);
  - professor comenta sem pai → 201;
  - `intruso` (fora da turma) lista e comenta → 404 nos dois;
  - texto em branco → 422; pai de outra atividade → 422;
  - atividade com `disponivelEm` no futuro (criar uma nova): professor comenta 201, aluno lista e comenta → 404;
  - o mural continua listando os comentários de aviso sem os de atividade.

- [ ] **Step 2: Rodar o smoke e ver as novas verificações falharem**

Run: `python3 -I scripts/smoke-p1.py`
Expected: as verificações `RF14a` com `FAIL` (404 nas rotas).

- [ ] **Step 3: Escrever `V4__comentario_em_atividade.sql`:** `aviso_id` passa a aceitar nulo; coluna `atividade_id UUID REFERENCES atividade(id) ON DELETE CASCADE`; `CHECK ((aviso_id IS NOT NULL) <> (atividade_id IS NOT NULL))`; índice `comentario_atividade_idx (atividade_id)`.

- [ ] **Step 4: Ajustar `Comentario` (`aviso` opcional, novo `atividade`), `ComentarioRepository`, `ResponseComentarioDTO`, e implementar `criarNaAtividade` e `listarDaAtividade` em `ComentarioService`** (injetar `AtividadeRepository` e `InscricaoRepository`; pai é validado contra a mesma atividade).

- [ ] **Step 5: Adicionar as duas rotas no `AtividadeController`** (usar `authService.getUsuarioAutenticado(session)` como as demais) e documentar em `docs/openapi.yaml` (rota `/atividades/{atividadeId}/comentarios`; `Comentario` ganha `atividadeId` e `avisoId` deixa de ser obrigatório).

- [ ] **Step 6: Rebuild e rodar o smoke**

Run: `docker compose up -d --build && python3 -I scripts/smoke-p1.py`
Expected: 0 `FAIL`, incluindo todas as `RF14a`.

- [ ] **Step 7: Commit (somente com autorização)** `feat(comentario): comentarios e respostas em atividade (RF14)`

---

### Task 3: Front dos comentários em atividade

**Files:**
- Create: `front/src/features/comentarios/comentarios-thread.tsx`, `api.ts`, `comentarios-atividade.tsx`, `comentarios-atividade.test.tsx`
- Modify: `front/src/features/avisos/mural-aba.tsx`, `features/entregas/detalhe-page.tsx`, `features/entregas/entregas-page.tsx`, `mocks/domain.ts`, `mocks/db.ts`, `mocks/handlers/atividades.ts`, `src/lib/api.generated.ts` (gerado)
- Test: `front/src/features/comentarios/comentarios-atividade.test.tsx`, `front/src/features/avisos/mural.test.tsx` (deve continuar passando)

**Interfaces:**
- Consumes: rotas da Task 2 em `docs/openapi.yaml`.
- Produces:
  - `ComentariosThread({ comentarios, aoComentar, aoResponder, pendente, placeholder }: { comentarios: Comentario[]; aoComentar: (texto: string) => Promise<void>; aoResponder: (texto: string, paiId: string) => Promise<void>; pendente: boolean; placeholder: string })` em `comentarios-thread.tsx`: o corpo de `AvisoCard` abaixo do texto (lista, `ComentarioLinha`, `FormResposta`, caixa "Novo comentário"), extraído sem mudar a aparência.
  - `useComentariosAtividade(atividadeId: string)` e `useCriarComentarioAtividade(atividadeId: string)` em `api.ts`.
  - `ComentariosAtividade({ atividadeId }: { atividadeId: string })` com título "Dúvidas e comentários", estado vazio "Ainda não há comentários.", estado de erro com "Tentar de novo".

- [ ] **Step 1: Escrever `comentarios-atividade.test.tsx`** (no padrão de `mural.test.tsx`): (a) aluno vê a lista vazia e envia um comentário, que aparece; (b) professor responde e a resposta aparece sob o comentário; (c) erro 500 mostra o estado de erro com o botão de repetir; (d) o botão de enviar fica desabilitado com texto em branco.

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `cd front && npx vitest run src/features/comentarios`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: `npm run generate:api`; atualizar o mock** (`ComentarioDb` ganha `atividadeId?`, `db.comentariosAtividade: ComentarioDb[]`, handlers `GET/POST /atividades/:atividadeId/comentarios` com as mesmas regras da Task 2: 404 fora da turma ou atividade fechada para o aluno, 422 texto vazio e pai de outra atividade, um nível de resposta) e cobrir o mock em `api-simulada.test.ts` ou `handlers.test.ts` (no mesmo estilo dos casos do mural).

- [ ] **Step 4: Extrair `ComentariosThread` de `mural-aba.tsx`** (o mural passa a usá-lo) e rodar `npx vitest run src/features/avisos`.
Expected: `mural.test.tsx` passa sem mudanças.

- [ ] **Step 5: Criar `api.ts` e `comentarios-atividade.tsx`; incluir `<ComentariosAtividade atividadeId={...} />` no fim de `DetalheAtividadePage` (antes de fechar a `section`) e em `EntregasPage`.**

- [ ] **Step 6: Verificar**

Run: `cd front && npm run test && npx tsc --noEmit && npm run lint`
Expected: tudo verde.

- [ ] **Step 7: Commit (somente com autorização)** `feat(front): comentarios na pagina da atividade (RF14)`

---

### Task 4: Notificações: tabela V5, leitura, "atividade nova" e "prazo próximo"

**Files:**
- Create: `db/migration/V5__notificacoes.sql`; pacote `classes/notificacao/` com `Notificacao.java`, `TipoNotificacao.java`, `NotificacaoRepository.java`, `NotificacaoService.java`, `NotificacaoController.java`, `ResponseNotificacaoDTO.java`, `ResponseNotificacoesDTO.java`
- Modify: `docs/openapi.yaml`
- Test: `scripts/smoke-p1.py` (bloco novo "RF17")

**Interfaces:**
- Produces:
  - `enum TipoNotificacao { AVISO_NOVO, ATIVIDADE_NOVA, ATIVIDADE_ALTERADA, COMENTARIO_NOVO, RESPOSTA_NOVA, NOTA_PUBLICADA }`
  - `record ResponseNotificacaoDTO(String id, String tipo, String texto, UUID turmaId, UUID atividadeId, UUID avisoId, LocalDateTime criadaEm, boolean lida, boolean paraProfessor)`; `tipo` também aceita `"PRAZO_PROXIMO"` (só nos prazos); `id` é `"prazo-<atividadeId>"` nos prazos; `paraProfessor` é verdadeiro quando o destinatário é o professor da turma (o front usa para escolher o link).
  - `record ResponseNotificacoesDTO(int naoLidas, List<ResponseNotificacaoDTO> itens, List<ResponseNotificacaoDTO> prazosProximos)`
  - `NotificacaoService`:
    - `void notificar(Usuario destinatario, TipoNotificacao tipo, String texto, Turma turma, Atividade atividade, Aviso aviso)` (`atividade` e `aviso` podem ser nulos; quem chama nunca passa o próprio autor como destinatário)
    - `void notificarAlunosDaTurma(Turma turma, Usuario autor, TipoNotificacao tipo, String texto, Atividade atividade, Aviso aviso)` (todos os inscritos menos o autor)
    - `ResponseNotificacoesDTO listar(Usuario usuario)`
    - `void marcarLida(UUID id, Usuario usuario)` (404 se não for do usuário) e `void marcarTodasLidas(Usuario usuario)`
  - Rotas: `GET /api/v1/notificacoes` → `ResponseNotificacoesDTO`; `POST /api/v1/notificacoes/{id}/lida` → 204; `POST /api/v1/notificacoes/lidas` → 204.
- Tabela `notificacao`: `id UUID PK`, `usuario_id` FK `ON DELETE CASCADE`, `tipo VARCHAR(30)`, `texto VARCHAR(300)`, `turma_id` FK cascade, `atividade_id` FK cascade nulo, `aviso_id` FK cascade nulo, `criada_em TIMESTAMP(6)`, `lida_em TIMESTAMP(6)` nulo; índice `(usuario_id, criada_em DESC)`; índice único parcial `(usuario_id, atividade_id) WHERE tipo = 'ATIVIDADE_NOVA'`.

- [ ] **Step 1: Escrever o bloco "RF17" no smoke** com `check("RF17", ...)`:
  - sem sessão → 401 em `GET /notificacoes`;
  - aluno: `GET /notificacoes` traz `ATIVIDADE_NOVA` da atividade `A` (criada com `disponivelEm` padrão) e `naoLidas >= 1`;
  - duas chamadas simultâneas (`ThreadPoolExecutor`, como o bloco de envios simultâneos) → ainda uma só `ATIVIDADE_NOVA` para `A`;
  - professor não recebe `ATIVIDADE_NOVA`;
  - atividade com `disponivelEm` no futuro: aluno não recebe `ATIVIDADE_NOVA` nem prazo dela;
  - prazo próximo: atividade com `prazoFinal` em 24 h aparece em `prazosProximos` do aluno com `id` começando em `prazo-`; depois que o aluno entrega, some; atividade com prazo em 5 dias não aparece; `prazosProximos` não altera `naoLidas`;
  - `POST /notificacoes/{id}/lida` → 204 e `naoLidas` cai 1; repetir é 204; `intruso` marcando a notificação do aluno → 404 e a do aluno continua não lida;
  - `POST /notificacoes/lidas` → 204 e `naoLidas == 0`;
  - aluno que saiu da turma (`DELETE /turmas/{id}/inscricao`) não vê mais itens nem prazos dela.

  O corte de 50 e o `naoLidas` total ficam cobertos em um teste JUnit de unidade (Step 2).

- [ ] **Step 2: Escrever `NotificacaoServiceTest`** (`api/src/test/java/.../classes/notificacao/`, Mockito com os repositórios): `listar_corta_em_50_mas_conta_todas_nao_lidas` (60 não lidas gravadas → `itens.size() == 50` e `naoLidas == 60`), `notificarAlunosDaTurma_exclui_o_autor` (turma com 3 alunos, um deles autor → 2 notificações gravadas).

- [ ] **Step 3: Rodar smoke e teste e ver falharem**

Run: `cd api && ./mvnw -q test -Dtest=NotificacaoServiceTest; cd .. && python3 -I scripts/smoke-p1.py`
Expected: teste não compila; verificações `RF17` com `FAIL`.

- [ ] **Step 4: Escrever `V5__notificacoes.sql` e as classes de domínio** conforme a tabela acima.

- [ ] **Step 5: Implementar `NotificacaoService.listar`** em ordem: (1) gerar `ATIVIDADE_NOVA` faltantes para o aluno: atividades das turmas dele com `disponivelEm <= agora`, `disponivelEm >= max(agora - 14 dias, inscricao.criadoEm, inicioDasNotificacoes)`, sem notificação do tipo; `criada_em = disponivelEm`; inserir com `ON CONFLICT DO NOTHING` (query nativa) por causa da corrida; (2) buscar os 50 itens mais recentes do usuário, **filtrando por turmas em que ele ainda é professor ou inscrito**; (3) `naoLidas` = total de `lida_em IS NULL` nessas turmas; (4) `prazosProximos` conforme o spec, só para atividades disponíveis, sem entrega do aluno e de turmas em que ele está inscrito. `inicioDasNotificacoes` é lido uma vez no `@PostConstruct` de `SELECT installed_on FROM flyway_schema_history WHERE version = '5'` via `JdbcTemplate`. Textos: ATIVIDADE_NOVA "Nova atividade em <turma>: <nome>."; prazo "O prazo de <nome> termina <hoje/amanhã/dd/MM> às HH:mm."

- [ ] **Step 6: Implementar `marcarLida`, `marcarTodasLidas`, o controller e documentar as 3 rotas em `docs/openapi.yaml`** (schemas `Notificacao` e `Notificacoes`).

- [ ] **Step 7: Rebuild, testes e smoke**

Run: `cd api && ./mvnw -q test; cd .. && docker compose up -d --build && python3 -I scripts/smoke-p1.py`
Expected: testes verdes, 0 `FAIL`.

- [ ] **Step 8: Commit (somente com autorização)** `feat(notificacoes): tabela, leitura, atividade nova e prazo proximo (RF17)`

---

### Task 5: Ganchos que geram as notificações dos eventos

**Files:**
- Modify: `classes/aviso/AvisoService.java`, `classes/atividade/AtividadeService.java`, `classes/entrega/EntregaService.java`, `classes/comentario/ComentarioService.java`
- Test: `scripts/smoke-p1.py` (estender o bloco "RF17")

**Interfaces:**
- Consumes: `NotificacaoService.notificar` e `notificarAlunosDaTurma` (Task 4); `ComentarioService.criarNoAviso` e `criarNaAtividade` (Tasks 1 e 2).
- Produces: nenhuma assinatura nova; as notificações saem dentro das mesmas transações:

| Evento | Gancho | Notificação |
|---|---|---|
| aviso criado | `AvisoService.criarAviso` | `notificarAlunosDaTurma(..., AVISO_NOVO, "Novo aviso em <turma>.", null, aviso)` |
| atividade editada | `AtividadeService.atualizar` | só se a atividade já está disponível **e** mudou nome, descrição, tipo, prazo, disponibilidade ou aceitaAtraso: `ATIVIDADE_ALTERADA` "A atividade <nome> foi alterada." |
| nota publicada | `EntregaService.avaliar` | aluno da entrega: `NOTA_PUBLICADA` "Sua entrega de <nome> foi avaliada."; vale também na reavaliação |
| comentário sem pai de aluno | `ComentarioService.criarNoAviso` e `criarNaAtividade` | professor da turma: `COMENTARIO_NOVO` "<autor> comentou em <alvo>." |
| resposta (qualquer autor) | idem | autor do comentário original, se não for o próprio autor da resposta: `RESPOSTA_NOVA` "<autor> respondeu ao seu comentário." |

Comentário do professor sem pai não notifica ninguém.

- [ ] **Step 1: Estender o smoke** (`check("RF17", ...)`, lendo `GET /notificacoes` do destinatário antes e depois):
  - professor publica aviso → aluno ganha `AVISO_NOVO`; o professor não;
  - professor edita só o nome da atividade → aluno ganha `ATIVIDADE_ALTERADA`; reenviar a edição **igual** não gera outra;
  - professor edita atividade com `disponivelEm` futuro → aluno não ganha nada;
  - professor avalia → aluno ganha `NOTA_PUBLICADA`; avalia de novo com outra nota → mais uma;
  - aluno comenta em atividade → professor ganha `COMENTARIO_NOVO`; o aluno não;
  - professor responde → aluno ganha `RESPOSTA_NOVA`; aluno responde a um comentário do professor → professor ganha `RESPOSTA_NOVA` e `paraProfessor` é `true`;
  - professor comenta sem pai → nenhum aluno ganha notificação;
  - o mesmo vale para comentário de aviso (um caso: aluno comenta no aviso → professor ganha `COMENTARIO_NOVO` com `avisoId`).

- [ ] **Step 2: Rodar o smoke e ver falhar**

Run: `python3 -I scripts/smoke-p1.py`
Expected: as novas verificações com `FAIL`.

- [ ] **Step 3: Implementar os ganchos da tabela** (para "editada com mudança" comparar os valores antigos antes de gravar). O texto do alvo é "uma atividade" ou "um aviso" mais o nome quando houver.

- [ ] **Step 4: Rebuild e rodar tudo**

Run: `cd api && ./mvnw -q test; cd .. && docker compose up -d --build && python3 -I scripts/smoke-p1.py`
Expected: 0 `FAIL`.

- [ ] **Step 5: Commit (somente com autorização)** `feat(notificacoes): gera notificacoes de aviso, atividade, nota e comentarios`

---

### Task 6: Sino e central de notificações no front

**Files:**
- Create: `front/src/features/notificacoes/api.ts`, `sino.tsx`, `lista-notificacoes.tsx`, `destino.ts`, `notificacoes.test.tsx`, `destino.test.ts`; `front/src/mocks/handlers/notificacoes.ts`
- Modify: `front/src/components/shell/header.tsx`, `features/atividades/turma-page.tsx`, `mocks/db.ts`, `mocks/domain.ts`, `mocks/handlers/{atividades,avisos,entregas}.ts`, `mocks/handlers/index.ts`, `src/lib/api.generated.ts` (gerado)
- Test: `notificacoes.test.tsx`, `destino.test.ts`, `components/shell/app-shell.test.tsx` (ajustar se o cabeçalho mudar)

**Interfaces:**
- Consumes: rotas da Task 4; tipos gerados `Notificacao` e `Notificacoes`.
- Produces:
  - `useNotificacoes()` (`refetchInterval: 60_000`, `refetchOnWindowFocus: true`), `useMarcarLida()`, `useMarcarTodasLidas()` em `api.ts`; as mutações invalidam `['notificacoes']`.
  - `destinoDaNotificacao(n: Notificacao): string` em `destino.ts`: tem `avisoId` → `/turmas/{turmaId}?aba=mural`; tem `atividadeId` e `paraProfessor` → `/atividades/{id}/entregas`; tem `atividadeId` → `/atividades/{id}`.
  - `Sino()` em `sino.tsx`: botão com `Bell`, contador (oculto em 0, "9+" acima de 9), `aria-label` "Notificações, N não lidas" (ou "Notificações" em 0), `aria-live="polite"` só no contador; abre `ListaNotificacoes` em popover (desktop) ou `ResponsiveSheet` (celular), reaproveitando `components/responsive-sheet.tsx`.
  - `ListaNotificacoes`: itens (texto, turma implícita no texto, tempo relativo "há 2 h" via `lib/format.ts`; não lidas em destaque), botão "Marcar todas como lidas", seção "Prazos próximos" abaixo, estado vazio "Nenhuma notificação por enquanto.", estado de erro com "Tentar de novo". Clicar num item grava como lido e navega para `destinoDaNotificacao`.
  - `TurmaPage` abre a aba Mural quando a URL tem `?aba=mural`.
  - `mocks/handlers/notificacoes.ts` exporta `notificacoesHandlers` e `notificarNoMock(...)`; os handlers de avisos, atividades (edição) e avaliação chamam `notificarNoMock` com as mesmas regras da Task 5, e `GET /notificacoes` gera `ATIVIDADE_NOVA` e prazos como na Task 4.

- [ ] **Step 1: Escrever `destino.test.ts`** (3 casos acima) e `notificacoes.test.tsx`: (a) com 3 não lidas o sino mostra "3" e o `aria-label` correspondente; (b) com 12 mostra "9+"; (c) com 0 não mostra contador; (d) abrir lista com itens e clicar num item chama a marcação e navega; (e) "Marcar todas como lidas" zera o contador; (f) lista vazia mostra a mensagem; (g) "Prazos próximos" aparece separado e não entra no contador; (h) erro 500 mostra o estado de erro e "Tentar de novo" refaz a chamada.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd front && npx vitest run src/features/notificacoes`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: `npm run generate:api`; implementar `api.ts`, `destino.ts`, mocks (com testes do mock no estilo de `handlers.test.ts`), `Sino`, `ListaNotificacoes`**; renderizar `<Sino />` em `header.tsx` ao lado do `AvatarMenu`; ajustar `TurmaPage` para `?aba=mural`.

- [ ] **Step 4: Verificar**

Run: `cd front && npm run test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tudo verde.

- [ ] **Step 5: Commit (somente com autorização)** `feat(front): sino e central de notificacoes (RF17)`

---

### Task 7: Jornada real, documentação e verificação final

**Files:**
- Modify: `front/e2e-real/jornada-p1.spec.ts`, `README.md`, `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/INTEGRACAO.md`
- Test: `front/e2e-real/jornada-p1.spec.ts`

- [ ] **Step 1: Escrever o cenário `RF14a e RF17 aluno comenta, professor responde e o sino avisa`** (depois dos cenários existentes, mesma configuração serial): aluno abre a atividade e comenta; professor entra, vê o sino com "1", abre a lista, clica no item e chega à tela de entregas da atividade; professor responde ao comentário; aluno vê o sino com contador, abre, "Marcar todas como lidas" e o contador some.

- [ ] **Step 2: Rodar contra a API local e ver passar**

Run: `docker compose up -d --build && cd front && npm run test:e2e:real`
Expected: 6 testes passando (5 antigos + 1 novo). Se o novo falhar por seletor, ajustar o seletor, não o comportamento.

- [ ] **Step 3: Atualizar a documentação:** README (tabela de requisitos: RF14 em atividade e RF17 como feitos, só o sino; `RF13` segue sem direcionamento), ROADMAP (estado e número de testes), BACKLOG (tirar RF17 da lista de pendentes; registrar "comentário em atividade" em "Feito depois da P1"; registrar a decisão "notificação só no app"), INTEGRACAO (novas rotas).

- [ ] **Step 4: Verificação final completa**

Run: `cd api && ./mvnw -q test; cd .. && docker compose up -d --build && python3 -I scripts/smoke-p1.py; cd front && npm run test && npx tsc --noEmit && npm run lint && npm run build && npm run test:e2e:real`
Expected: tudo verde, 0 `FAIL` no smoke. Anotar os totais reais (não os estimados) no ROADMAP.

- [ ] **Step 5: Commit (somente com autorização)** `docs: marca comentarios em atividade e notificacoes como feitos`

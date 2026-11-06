# Comentários em atividade e central de notificações (RF14 completo e RF17)

Data: 05/11/2026. Status: **aguardando aprovação do Rilson**.

## Intenção

O requisito RF14 fala em comentários "relacionados às atividades", mas hoje só se comenta em **avisos** do mural. O RF17 pede que o usuário receba notificações sobre suas atividades, e nada disso existe. O Rilson quer os dois, nessa ordem, com banco, API e front, para a entrega da P2.

## Metas

1. Aluno e professor comentam na página da atividade; o professor responde (um nível de resposta, como no mural).
2. Sino no cabeçalho com contador de não lidas, lista de notificações e marcação como lida.
3. As notificações cobrem o que o RF17 lista: prazo próximo, alteração de atividade, aviso novo e "outras alterações relevantes" (comentário ou resposta nova, nota publicada).
4. Tudo coberto por testes no mesmo padrão do projeto (JUnit na API, Vitest no front, smoke e jornada real).

## Não metas

- Notificação fora do app (e-mail, push, WebSocket). **Decidido pelo Rilson: só o sino no app.**
- Complexidade e modalidade (já decidido que não entram).
- Grupos (RF06, RF12) e calendário (RF08): virão depois, cada um com seu desenho.
- Preferências de notificação, silenciar turma, apagar notificação.
- Editar ou excluir comentário (hoje também não existe no mural).

## Antimetas (seria falha mesmo funcionando)

- Notificação que cobra ou pressiona o aluno (DESIGN.md §"Não há ... notificação de cobrança"). O texto do "prazo próximo" informa, não cobra: "O prazo de X termina amanhã às 23:59."
- Notificar o autor da própria ação.
- Mostrar a um usuário notificação de turma da qual ele saiu ou de atividade que ainda não está disponível para ele.

## Restrições do projeto

- Spring Boot 3, Java 21, Postgres 16, Flyway (migrations: **V4** (comentário em atividade) e **V5** (notificações, separadas no plano; "depois da V4" abaixo vale como depois da V5)), sessão em `HttpSession`, erros via `AppException`.
- Contrato em `docs/openapi.yaml`; o front gera tipos com `npm run generate:api`. A API simulada do front (`front/src/mocks/`, com testes) é especificação executável e precisa acompanhar.
- Front: React 19, TanStack Query, React Router, shadcn/Lucide (sem emojis).
- Textos em português do Brasil.

## Parte 1: comentário em atividade

**Banco (V4):** `comentario.aviso_id` passa a aceitar nulo; nova coluna `atividade_id UUID REFERENCES atividade(id) ON DELETE CASCADE`; `CHECK` garantindo que **exatamente um** dos dois está preenchido; índice em `atividade_id`.

**API:**
- `GET /api/v1/atividades/{id}/comentarios` (ordem cronológica) e `POST` com `{texto, comentarioPaiId?}`; 201 no POST.
- `ResponseComentarioDTO` ganha `atividadeId` (mantém `avisoId`; um dos dois é nulo).
- Permissão: professor da turma, ou aluno inscrito **com a atividade já disponível** (mesma regra do detalhe, 404 se não disponível). Quem não é da turma recebe 404, como no detalhe da atividade.
- **Professor e alunos da turma podem comentar e responder** (decidido pelo Rilson), igual ao mural. Não há restrição extra de papel.
- Comentário do professor sem `comentarioPaiId` não notifica ninguém (não há destinatário claro).
- Resposta a resposta vira resposta ao comentário original (um nível), igual ao mural. O pai precisa pertencer à mesma atividade (422 se não).
- Mesmos limites do mural: texto 1 a 3000 caracteres, após `trim`.
- A lógica de comentário hoje está dentro de `AvisoService`. Extrair para um `ComentarioService` usado pelos dois alvos, sem mudar o comportamento do mural.

**Front:** seção "Dúvidas e comentários" na página de detalhe da atividade (`detalhe-page` do aluno e a do professor), reaproveitando o componente de comentário e de resposta do `mural-aba.tsx` (extrair para um componente compartilhado). Estados de vazio, carregando e erro como no resto do app. Hook `useComentariosAtividade` com `invalidateQueries`.

## Parte 2: notificações

**Tabela `notificacao` (V4):** `id UUID`, `usuario_id` (destinatário, `ON DELETE CASCADE`), `tipo`, `texto VARCHAR(300)`, `turma_id`, `atividade_id` (nulo para aviso), `aviso_id` (nulo para atividade), `criada_em`, `lida_em` (nulo = não lida). Índice `(usuario_id, criada_em DESC)`. `turma_id`, `atividade_id` e `aviso_id` servem para montar o link e têm FK com `ON DELETE CASCADE`, para a notificação sumir junto com o item de origem.

**Tipos gravados (um serviço `NotificacaoService.notificar(...)` chamado dentro da transação do evento):**

| Tipo | Quando | Destinatários |
|---|---|---|
| `AVISO_NOVO` | professor publica aviso | alunos inscritos na turma |
| `ATIVIDADE_NOVA` | a atividade **abre** para o aluno (`disponivelEm` já passou) | cada aluno inscrito; **gerada na leitura** (ver "Atividade nova na leitura") |
| `ATIVIDADE_ALTERADA` | professor edita atividade | alunos inscritos, só se a atividade já está disponível e mudou nome, descrição, tipo, prazo, disponibilidade ou aceitaAtraso |
| `COMENTARIO_NOVO` | **aluno** comenta (sem `comentarioPaiId`) em atividade ou aviso | professor da turma |
| `RESPOSTA_NOVA` | alguém (professor ou aluno) responde um comentário | autor do comentário original |
| `NOTA_PUBLICADA` | professor avalia uma entrega | autor da entrega (aluno); reavaliação também notifica |

Regras gerais: nunca notificar o próprio autor; um evento gera no máximo uma notificação por destinatário.

**Atividade nova na leitura:** em `GET /notificacoes` de um aluno, o serviço cria (de forma idempotente) uma `ATIVIDADE_NOVA` para cada atividade das turmas dele com `disponivelEm <= agora`, sem notificação desse tipo para ele, e que abriu nos **últimos 14 dias e depois da data da V4**. `criada_em` = `disponivelEm`. Índice único parcial `(usuario_id, atividade_id) WHERE tipo = 'ATIVIDADE_NOVA'` evita duplicata em chamadas simultâneas. Vale igual para atividade criada já aberta ou agendada; nenhum agendador. O professor não recebe esse tipo.

**Prazo próximo (derivado, sem tabela):** atividades **disponíveis**, **não entregues**, do aluno, com `prazoFinal` entre agora e daqui a 48 horas. Aparecem na mesma lista, no topo ou ordenadas por data, marcadas como tipo `PRAZO_PROXIMO`, sem `lida_em` e **sem contar como não lidas** (são informação do momento, somem sozinhas quando entrega ou quando o prazo passa). Sem id próprio de notificação: o id é `prazo-<atividadeId>`.

**API:**
- `GET /api/v1/notificacoes` → `{ naoLidas: int, itens: [...] }`; itens gravados mais recentes primeiro, **no máximo 50**, mais os de prazo próximo à parte em `prazosProximos`.
- `POST /api/v1/notificacoes/{id}/lida` → 204; 404 se não for do usuário.
- `POST /api/v1/notificacoes/lidas` ("marcar todas") → 204.
- 401 sem sessão, como os demais.

**Front:** ícone de sino (Lucide `Bell`) em `header.tsx`, com contador (some quando zero; "9+" acima de 9). Clique abre uma folha/popover com a lista; item mostra texto, turma e "há 2 h"; clicar marca como lida e navega para a atividade, aviso (aba Mural da turma) ou entrega. Botão "Marcar todas como lidas". "Prazos próximos" em seção própria, abaixo. Estado vazio: "Nenhuma notificação por enquanto." Atualização por `refetchInterval` de 60 s e ao focar a janela (sem WebSocket). Acessível: botão com `aria-label` com o número, lista navegável por teclado, `aria-live="polite"` só no contador.

## Testes e verificação

- API: testes de serviço/integração para cada tipo de notificação (destinatários certos, autor não é notificado), permissões de comentário em atividade, CHECK do banco, "marcar como lida" de outro usuário (404).
- Front: Vitest para sino, lista, marcar lida, comentários em atividade; API simulada atualizada com os mesmos comportamentos.
- `scripts/smoke-p1.py`: novos passos de comentário em atividade e notificações; `front/e2e-real`: um cenário (professor publica aviso, aluno vê o contador, abre, marca lida).
- Antes de afirmar que está pronto: rodar API, front (`tsc`, ESLint, testes, build), smoke e jornada real localmente.

## Deixado ao construtor

Nomes de classes, formato exato do JSON além do descrito, layout visual do sino (seguindo `docs/design/`), texto exato de cada notificação (em português, informativo, sem cobrança), ordem das tarefas.

## Calls minhas (conferir)

1. (Decidido pelo Rilson) professor e alunos respondem, em atividade e no mural.
2. Notificações antigas ficam: não há limpeza automática; a listagem corta em 50.
3. Prazo próximo = 48 h e não entregue; não conta no contador.
4. `ATIVIDADE_NOVA` é gerada na leitura (janela de 14 dias, depois da V4), para cobrir atividade agendada sem agendador. **Proposta minha, o Rilson ainda não confirmou.**
5. Não vou notificar alunos que se inscreveram depois do evento.
6. Entregas feitas **antes** da V4 não geram notificação retroativa.

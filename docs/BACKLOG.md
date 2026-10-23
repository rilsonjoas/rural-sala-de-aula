# Backlog — Rural Sala de Aula

Tudo o que **não** é P1. Sem datas. O escopo da entrega de 19/10/2026 está no [README](../README.md).

## Decidido não implementar

- **Complexidade da atividade** (RF10 e RF05): sem campo, sem indicador e sem filtro ou ordenação por complexidade. Decisão confirmada com o Luiz Felipe em conversa direta (sem data registrada). Se um dia entrar: coluna na atividade (3 níveis), campo no formulário do professor, indicador na lista e no detalhe, e `ordenar=complexidade` e filtro no `GET /atividades`.
- **Modalidade da atividade** (RF10 e RF05): não é um campo; o tipo `PROJETO_EM_GRUPO` já indica que é em grupo e o filtro por tipo cobre o caso. Mesma decisão.

- **Limitar quem cria turma:** qualquer conta cria turma, e o papel é contextual por turma (ADR-0008). O Rilson decidiu manter assim, sem convite nem aprovação por e-mail institucional.
- **Aviso de privacidade (LGPD) no cadastro:** não será feito, por ser um projeto universitário. O app coleta nome e e-mail sem informar a finalidade; o risco está aceito.

## Requisitos funcionais (do documento de requisitos)

| RF | O que é | Observações |
|---|---|---|
| RF03b | Sair da turma (aluno) | o documento numera duas vezes o RF03 |
| RF06 | Solicitar e participar de grupos | atividade "Em grupo" já pode ser cadastrada, mas o aluno entrega individualmente até este RF entrar |
| RF07 | Sair do grupo | |
| RF08 | Calendário com carga semanal (pesada, média, livre) | o texto classifica por quantidade **e complexidade**; sem complexidade (decisão de escopo), a classificação teria de usar só a quantidade de atividades |
| RF11 | Atualizar atividades | o P1 não edita atividade, então a folha Nova atividade pede confirmação antes de salvar. O texto cita alterar complexidade e modalidade, que não existem no projeto |
| RF12 | Configurar e aprovar grupos | |
| RF14b | Responder a comentários (comentar em aviso já existe) | RF13 e RF14 entraram no mural da turma |
| RF17 | Receber notificações | |

## Requisitos não funcionais

| RNF | O que falta |
|---|---|
| RNF01 Usabilidade | medir com usuários reais (aluno e professor) depois do P1 |
| RNF02 Integridade das entregas | o P1 guarda aluno, atividade e `enviada_em`. Falta guardar o **hash (SHA-256) do arquivo** para provar que não foi alterado |
| RNF03 Escalabilidade | paginação das listas, índices por consulta real, armazenamento de arquivos em bucket (ADR-0003) |

## Produto e interface

- **Logo própria**, inspirada nos conceitos da UFRPE e não no desenho (o manual veda alterar o símbolo). Troca o capelo provisório do cabeçalho.
- **Lista de inscritos que ainda não entregaram**, na tela de entregas do professor (hoje só aparece quem entregou).
- **Contador de entregas a avaliar no card de turma** do professor (hoje só aparece em cada atividade; somar por turma pede um campo na API ou várias requisições).
- Recuperação de senha, edição de perfil e tema escuro.
- Filtros do aluno salvos no servidor (hoje ficam no navegador).
- **Marcar como entregue** (o professor registra uma entrega feita fora do sistema), para a atividade não ficar "Atrasada" por engano.
- **Progresso real do upload** (hoje a barra é indeterminada; `fetch` não informa progresso; pede `XMLHttpRequest`).
- Dividir o código por rota (o pacote principal tem ~700 KB, 215 KB comprimido).
- Tabela também nas atividades de uma turma no desktop (hoje cards em 2 colunas).
- `GET /me` responde 401 para visitante e o navegador registra isso no console; um endpoint que devolva 200 com `null` evitaria o ruído.
- **Testar em aparelho real** (leitor de tela TalkBack/VoiceOver, fonte grande): a auditoria automática não substitui.
- Fonte oficial da UFRPE (Akzidenz-Grotesk ou Myriad Pro), se a universidade exigir.

## Back-end e infraestrutura (com o Luiz)

- **Contrato mudou durante o front (ver `plano-de-design.md` C7):** `Atividade.nota`, `disponivelEm` obrigatório, `diasAula` com ao menos um dia, `GET /atividades` com os filtros do RF05 (estado, tipo e turma), papel contextual por turma (ADR-0008). A API simulada do front (`front/src/mocks/`, com testes) é uma especificação executável do comportamento esperado.

- **Feito (19/10/2026):** todos os endpoints do `docs/openapi.yaml`, a sessão em cookie httpOnly e o armazenamento dos arquivos em volume (ADR-0003).
- **CSRF (decidido):** a sessão usa `HttpSession` do Spring, sem Spring Security e sem token CSRF. Duas camadas cobrem o risco: o cookie é `SameSite=Lax` (não vai em POST/PUT/DELETE de outro site) e o CORS do Spring recusa com 403, antes do controller, qualquer requisição cujo `Origin` não seja o próprio host nem `localhost` (`WebConfig`). `scripts/smoke-p1.py` verifica o bloqueio. Rever se o domínio ganhar subdomínios não confiáveis ou se a API for chamada de outra origem.
- **Integridade das entregas (decidido):** a unicidade "uma entrega por aluno e atividade" não cabe numa `UNIQUE` do banco porque `Entrega` usa herança `JOINED` (`atividade_id` e `aluno_id` ficam em tabelas diferentes). O envio é serializado por `pg_advisory_xact_lock` no par (atividade, aluno), e o smoke dispara 8 envios simultâneos e confere que sobra uma entrega. Se um dia a herança sair, mover para `UNIQUE (atividade_id, aluno_id)`.
- Confirmar que o professor define só o **prazo final** (a data de entrega é a do aluno) e ajustar o texto do RF10 no documento de requisitos.
- Confirmar que o aluno entrega individualmente atividades "Em grupo" até os grupos entrarem.
- Antivírus ou verificação do conteúdo dos arquivos enviados.
- Java 25 (LTS) e Postgres 17/18: hoje Java 21 e Postgres 16, alinhado ao Postgres compartilhado do Hetzner. Subir os dois juntos com a infra.
- **Feito (19/10/2026):** em produção no Hetzner, em `https://rural-sala-de-aula.narniano.com` (runbook em `1 - Pessoal/hetzner-infra/rural-sala-de-aula/README.md`). Pendências de infraestrutura (CI com a migration do zero, versão real no `/health`, sessão persistente, Sentry) estão na seção "Pendências para production-ready" desse README.

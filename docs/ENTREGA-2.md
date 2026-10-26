# Entrega 2 — roteiro do vídeo (8 minutos) e próximas semanas

Proposta de 26/10/2026 para a entrega de quarta-feira (28/10). Ajustar ao que a professora pediu. Contas de demonstração: `docs/ROADMAP.md` ("Dados de demonstração"); a senha fica com o Rilson.

## Roteiro do vídeo (≈ 8 min)

| Tempo | Cena | O que mostrar |
|---|---|---|
| 0:00–0:45 | Abertura | O problema (atividades e entregas espalhadas), o produto, a dupla, o endereço `https://rural-sala-de-aula.narniano.com`. |
| 0:45–2:45 | **Aluno** (Ana) | Login (RF01); "Minhas atividades" com filtros por estado e tipo e ordenação por prazo (RF05); abrir uma atividade e enviar um PDF (RF04); atividade avaliada com nota e comentário; entrar numa turma pelo código (RF02). |
| 2:45–5:00 | **Professor** (Helena) | Criar turma e ver o código (RF09); cadastrar atividade (RF10) e **editar** (RF11); tela de entregas: baixar o arquivo (RF16), **quem ainda não entregou**, avaliar com nota e comentário privado (RF15), SHA-256 do arquivo (RNF02). |
| 5:00–5:45 | **Mural** | Aviso da professora (RF13), comentário do aluno e resposta (RF14, RF14b); aluno **sai da turma** (RF03b). |
| 5:45–7:15 | **Engenharia** | Produção com HTTPS numa VPS; CI do GitHub verde; smoke de 120 verificações; `/api/v1/health` com o commit no ar; rate limit (6 senhas erradas → "Muitas tentativas"); backup e `verificar-uploads.sh` (13 arquivos íntegros). |
| 7:15–8:00 | **Próximos passos** | O que falta da P2 (grupos, calendário, notificações, testes) e como a dupla divide. |

Dicas: janela anônima com o zoom em 125%; ensaiar uma vez; não mostrar a senha; deixar as abas das duas contas já logadas (Ana e Helena) em navegadores ou perfis diferentes.

## Próximas semanas (proposta)

| Semana | Back-end (Luiz) | Front (Rilson) |
|---|---|---|
| 1 | Grupos RF06 e RF07 (solicitar, entrar e sair) + testes de serviço | Telas de grupos; entrega em grupo (`entrega_em_grupo`) |
| 2 | RF12 (configurar e aprovar grupos); listar membros e excluir turma e usuário | Aprovação de grupos; lista de membros da turma |
| 3 | RF08 (carga semanal) e paginação das listas | Calendário com carga pesada, média e livre |
| 4 | RF17 (notificações) | Central de notificações; teste em aparelho real e com usuários (RNF01) |

Sempre: testes automatizados do back-end entram junto de cada item, e o deploy é `make sala-deploy`.

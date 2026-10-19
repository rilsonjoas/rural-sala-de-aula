# CONTEXT.md — Rural Sala de Aula

Glossário do domínio (requisitos de origem em `docs/requisitos.md`). Use estes termos com precisão no código, nos tickets e nos ADRs.

## Termos

| Termo | Definição | Regras |
|---|---|---|
| `Usuario` | Pessoa com conta. Papel é contextual por turma (quem cria leciona; quem entra estuda). | E-mail único sem diferenciar maiúsculas. Data de nascimento opcional. |
| `turma` | Oferta de uma disciplina administrada por quem a criou (professor). Tem nome, disciplina, semestre (`2026.2`), dias de aula (1–7, ISO), código e descrição. | Código único (6–8 caracteres alfanuméricos, sem diferenciar maiúsculas). |
| `inscricao` | Vínculo aluno–turma, feito pelo código de inscrição. | Uma por par aluno–turma. O criador da turma não pode se inscrever como aluno nela. |
| `atividade` | Trabalho de uma turma com prazo definido pelo professor: nome, descrição, `tipo` (`PROVA`, `LISTA_DE_EXERCICIO`, `PROJETO_INDIVIDUAL`, `PROJETO_EM_GRUPO`), `prazo_final`, `disponivel_em`, `aceita_atraso`. | `disponivel_em ≤ prazo_final`. Se `aceita_atraso` for falso, envios após `prazo_final` são rejeitados. O aluno só vê a atividade depois de `disponivel_em`. |
| `entrega` | Arquivo enviado pelo aluno com data e hora. | Uma por aluno por atividade; reenvio substitui, exceto depois de avaliada (bloqueado, 409). |
| `avaliacao` | Nota (0–10) e comentário privado do professor sobre uma entrega. | Uma por entrega. |
| `aviso` | Mensagem do mural da turma com autor, data/hora e texto. | Todos os membros da turma visualizam. |
| `comentario` | Comentário em um aviso do mural. | Qualquer membro da turma pode comentar. |
| `estado da atividade` | Visão do aluno: PENDENTE, ENTREGUE, ENTREGUE_COM_ATRASO, CONCLUIDA (avaliada) ou ATRASADA; ENTREGUE_COM_ATRASO = `enviada_em` > `prazo_final`. | **Derivado** de `entrega`, `avaliacao` e `prazo_final`; nunca gravado. |

## Invariantes no banco (V1)

| Invariante | Mecanismo | SQLSTATE |
|---|---|---|
| E-mail e código de turma únicos | índices `usuario_email_unique`, `turma_codigo_unique` | `23505` |
| Inscrição e entrega únicas por par | PK de `inscricao`, `entrega_unica_por_aluno` | `23505` |
| Nota entre 0 e 10 | CHECK em `entrega` | `23514` |
| `disponivel_em` não passa do `prazo_final` | `atividade_datas_validas` | `23514` |

`bash scripts/check-schema.sh` prova cada uma contra um Postgres descartável.

# CONTEXT.md — Rural Sala de Aula

Glossário do domínio (requisitos de origem em `docs/requisitos.md`). Use estes termos com precisão no código, nos tickets e nos ADRs.

## Termos

| Termo | Definição | Regras |
|---|---|---|
| `Usuario` | Pessoa com conta. Tem `papel`: ALUNO ou PROFESSOR. | E-mail único sem diferenciar maiúsculas. |
| `turma` | Oferta de uma disciplina (código gerado pelo servidor: 6 caracteres sem 0, O, 1, I, L), administrada por um professor. Tem nome, disciplina, semestre (`2026.2`), dias de aula (1–7, ISO) e `codigo` de inscrição. | Só PROFESSOR cria. Código único (6–8 caracteres alfanuméricos, sem diferenciar maiúsculas). |
| `inscricao` | Vínculo aluno–turma, feito pelo código. | Só ALUNO. Uma por par aluno–turma. |
| `atividade` | Trabalho de uma turma (o professor define o `prazo_final`, o limite que define atraso; a data de entrega é a do aluno, `entrega.enviada_em`): nome, descrição, `complexidade` (BAIXA/MEDIA/ALTA), `tipo` (ATIVIDADE/TRABALHO/PROVA), `modalidade` (INDIVIDUAL/GRUPO), `prazo_final`, `disponivel_em`. | `disponivel_em ≤ prazo_final`. O envio nunca é bloqueado; depois do `prazo_final` conta como atraso. O aluno só vê a atividade depois de `disponivel_em`. Modalidade GRUPO existe no dado, mas grupos são backlog. |
| `entrega` | Arquivo enviado por um aluno a uma atividade, com data e hora. | Uma por aluno por atividade; reenvio substitui, exceto depois de avaliada (bloqueado, 409). Depois do `prazo_final` é aceita e marcada como atrasada. |
| `avaliacao` | Nota (0–10) e comentário privado do professor sobre uma entrega. | Uma por entrega. |
| `estado da atividade` | Visão do aluno: PENDENTE, ENTREGUE, ENTREGUE_COM_ATRASO, CONCLUIDA (avaliada) ou ATRASADA (sem entrega e agora > `prazo_final`); ENTREGUE_COM_ATRASO = `enviada_em` > `prazo_final`. | **Derivado** de `entrega`, `avaliacao` e `prazo_final`; nunca gravado (ADR-0005). |

## Invariantes no banco (V1)

| Invariante | Mecanismo | SQLSTATE |
|---|---|---|
| Só PROFESSOR é dono de turma | trigger `turma_professor_papel` | `23514` |
| Só ALUNO se inscreve | trigger `inscricao_aluno_papel` | `23514` |
| Só ALUNO entrega | trigger `entrega_aluno_papel` | `23514` |
| E-mail e código de turma únicos | índices `usuario_email_unique`, `turma_codigo_unique` | `23505` |
| Inscrição e entrega únicas por par | PK de `inscricao`, `entrega_unica_por_aluno` | `23505` |
| Nota entre 0 e 10 | CHECK em `avaliacao` | `23514` |
| `disponivel_em` não passa do `prazo_final` | `atividade_datas_validas` | `23514` |

`bash scripts/check-schema.sh` prova cada uma contra um Postgres descartável.

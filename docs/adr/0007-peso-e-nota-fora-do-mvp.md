# ADR-0007: Peso e nota da prova saem do MVP

- **Status:** accepted (2026-09-29)

## Contexto

O RF04 promises "registrar datas de provas, **pesos** e **notas** obtidas". Ao desdobrar o que isso exige, aparecem quatro problemas que compartilham a mesma raiz.

**A raiz é a unidade, e ninguém decidiu.**

| Onde | O que diz | Conflito |
|---|---|---|
| `openapi.yaml` / migration | `peso` entre 0 e 100 | percentual |
| `DESIGN.md` §5.3 | card mostra **"Peso 3.0"** | coeficiente, não percentual |
| `openapi.yaml` / migration | `nota` entre 0 e 100 | escala de centésimos |
| `CONTEXT.md` | gamificação reage a "bom resultado (≥ 7)" | **≥ 7 só faz sentido em escala 0–10** |

Na escala que está no banco, "≥ 7" significa 7% — que ninguém quis dizer. E há duas regras de XP contraditórias: `CONTEXT.md` diz que a gamificação reage a nota boa, e a tabela v0 da pauta diz "Nota registrada em prova: `20` (1× por prova)" — valor fixo, sem limiar.

Some-se a isso que a `DESIGN.md` promete **cálculo de médias** em dois lugares (§1 como pilar, §6 como "Panorama Geral (Créditos, Média, Freq.)") sem endpoint, tabela ou RF que o faça — e esse gap não estava na tabela de gaps da spec.

E o problema mais concreto: **`weight` era `required` no contrato.** O aluno não conseguia registrar a data de uma prova sem saber o peso dela — e nada consome o peso. A data é o que o MVP usa de verdade (RF10 conta regressiva, RF11 mês, RF07 cascata 7-3-1); o peso era um campo obrigatório sem uso travando a tela.

## Decisão

**No MVP, `prova` é título + data.** `peso` e `nota` saem da obrigatoriedade e ficam para a Fase 3, junto com o cálculo de médias e a regra de XP que os consome.

O que muda agora:

- `prova.peso` deixa de ser `NOT NULL` e sai do `required` de `ProvaRequest`; os tipos do frontend foram regenerados. O `CHECK` de 0–100 continua valendo quando o campo é preenchido.
- RF04 passa a ser "registrar data e título de provas".
- A tabela de gaps da `DESIGN.md` ganha o cálculo de médias e os dois conflitos de unidade.

O que **não** muda: as colunas `peso` e `nota` continuam existindo. São o gancho para quando a decisão voltar, e a V1 ainda não foi deployada — tirar adiante sairia de graça, mas preenchê-las hoje seria inventar dado que ninguém vai ler.

## O que fica para resolver na Fase 3

Uma única decisão, com quatro partes que não se separbem — é por isso que adiar junto não é postergação, é coerência:

1. **Escala da nota:** 0–10 (como a regra "≥ 7" assume, e como a faculdade usa) ou 0–100 (como o banco está)? Isso decide a conquista, o XP e a média de uma vez.
2. **Unidade do peso:** percentual (soma 100 por disciplina) ou coeficiente ("Peso 3.0" da spec)?
3. **Estado parcial:** o aluno lançou 2 de 3 provas. A média aparece, fica oculta, ou mostra "parcial"? E a soma dos pesos ainda não dá 100 — isso é erro, aviso ou estado normal enquanto o semestre anda?
4. **Regra de XP:** as duas versões já escritas (limiar ≥ 7 vs 20 fixos) não podem coexistir. Escolher uma, ou declarar que a nota não dá XP.

**A Fase 3 não começa a gamificação de nota antes de decidir 1 e 2.** Regra de XP escrita sobre escala errada é bug que só aparece com aluno real.

## Consequências

- O aluno registra a data de uma prova sem inventar peso. A data é o que o MVP precisa.
- A `DESIGN.md` para de prometer uma média que não existe, e o conflito "Peso 3.0" contra 0–100 fica visível em vez de latente.
- `CONTEXT.md` deixa de afirmar que a gamificação reage a "≥ 7" enquanto a escala do banco é 0–100.
- Se a decisão da Fase 3 for "nota em 0–10", a coluna `NUMERIC(5,2)` 0–100 vai precisar de migration de conversion. Não é caro agora (zero dado em produção) e é caro depois — mais um motivo para não decidir às pressas.

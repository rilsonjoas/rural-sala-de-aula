# ADR-0006 — Regras de prazo e de entrega

Status: aceito (2026-10-09)

## Contexto

O RF10 do documento de origem lista "data de entrega" e "prazo final" entre os atributos que o professor cadastra, mas só um deles define atraso. O RNF02 pede que a data e o horário de entrega do aluno sejam preservados.

## Decisão

- A atividade tem **um só prazo, o `prazo_final`**, definido pelo professor. O campo "data de entrega" não existe na atividade.
- A **data de entrega é a do aluno**: `entrega.enviada_em`.
- Atraso = depois do `prazo_final`: sem entrega vira ATRASADA; entrega depois dele vira ENTREGUE_COM_ATRASO (`Entrega.atrasada`).
- O envio **nunca é bloqueado por prazo**.
- Depois que o professor **avalia** a entrega, o reenvio é bloqueado (409), para não trocar o trabalho que já recebeu nota.
- Ordenar por prazo usa `prazoFinal`.

## Consequências

O cadastro fica mais simples e o estado é derivado (ADR-0005). O texto do RF10 diverge da implementação; o Luiz precisa confirmar e o documento de requisitos deve ser ajustado. Quem quiser uma meta além do prazo final precisará de um novo campo (backlog).

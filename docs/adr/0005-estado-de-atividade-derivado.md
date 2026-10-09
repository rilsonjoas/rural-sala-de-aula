# ADR-0005 — Estado da atividade é derivado

Status: aceito

## Contexto

RF05 filtra por pendente, entregue, concluída, atrasada e entregue com atraso.

## Decisão

O estado é calculado por consulta a partir de entrega, avaliacao e prazo_final, sem coluna própria. A referência de tempo é o `prazo_final` (ADR-0006).

## Consequências

Nunca diverge dos dados. Filtrar por estado exige JOIN; aceitável no volume da entrega.

# ADR-0007 — Papel escolhido livremente no cadastro

Status: substituído pela ADR-0008 (2026-10-19)

## Contexto

O RF01 pede nome, e-mail e senha e não diz como alguém passa a ser professor ou aluno.

## Decisão

No cadastro a pessoa escolhe "Aluno" ou "Professor", sem verificação. O papel é fixo depois de criado.

## Consequências

Qualquer pessoa pode criar turmas e ver entregas das próprias turmas (nunca de outras: a posse é checada por turma). Risco aceito no P1 por simplicidade. Mitigação no backlog: código de convite ou aprovação por e-mail institucional para o papel Professor.

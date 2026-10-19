# ADR-0008 — Papel contextual por turma

Status: aceito (2026-10-19). Substitui a ADR-0007.

## Contexto

A ADR-0007 fixava o papel (Aluno ou Professor) no cadastro. Na prática a mesma pessoa leciona uma turma e estuda em outra.

## Decisão

Não há papel na conta. Quem cria uma turma é o professor dela; quem entra pelo código é aluno nela. O cadastro pede só nome, e-mail, senha e data de nascimento (opcional). A navegação é a mesma para todos (Turmas e Atividades): "Minhas turmas" mostra as que a pessoa leciona e as que cursa, e "Minhas atividades" traz só as das turmas em que é aluna. O professor da turma não envia entregas nela nem se inscreve no próprio código.

## Consequências

Não existe mais o risco de "qualquer pessoa escolher Professor": criar turma é aberto e o poder fica restrito à própria turma (a posse é checada por turma). O convite para professor sai do backlog. O campo `papel` de `Usuario` fica no contrato só por compatibilidade e não é usado.

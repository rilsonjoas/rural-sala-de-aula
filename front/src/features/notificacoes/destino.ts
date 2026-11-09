import type { Notificacao } from './api';

/** Para onde a notificação leva: mural da turma, entregas (professor) ou detalhe da atividade (aluno). */
export function destinoDaNotificacao(n: Notificacao): string {
  if (n.avisoId) return `/turmas/${n.turmaId}?aba=mural`;
  if (n.atividadeId) return n.paraProfessor ? `/atividades/${n.atividadeId}/entregas` : `/atividades/${n.atividadeId}`;
  return `/turmas/${n.turmaId}`;
}

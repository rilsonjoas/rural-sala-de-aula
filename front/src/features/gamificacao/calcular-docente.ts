import type { Conquista, PerfilDocente } from './tipos';

export interface DadosDocente {
  turmasLecionadas: number;
  atividadesPorTurma: number;
  tiposDistintos: number;
  avaliacoesRealizadas: number;
  feedbacksComComentario: number;
  respostasNoMural: number;
  teveAtividadeComTodasAvaliadas: boolean;
}

export function obterTituloNivelDocente(nivel: number): string {
  if (nivel <= 1) return 'Professor Iniciante';
  if (nivel === 2) return 'Professor Orientador';
  if (nivel === 3) return 'Professor Mentor';
  return 'Professor Emérito';
}

export function calcularDocente(dados: DadosDocente): PerfilDocente {
  const nivelDocente = Math.max(1, Math.floor(dados.avaliacoesRealizadas / 10) + 1);
  const tituloNivel = obterTituloNivelDocente(nivelDocente);

  const conquistas: Conquista[] = [
    {
      id: 'dialogo-aberto',
      titulo: 'Diálogo Aberto',
      descricao: 'Respondeu a comentários de alunos no mural',
      icone: 'message-square-check',
      desbloqueada: dados.respostasNoMural >= 3,
      progressoAtual: Math.min(3, dados.respostasNoMural),
      progressoTotal: 3,
    },
    {
      id: 'feedback-completo',
      titulo: 'Feedback Completo',
      descricao: 'Avaliou entregas incluindo comentário privado além da nota',
      icone: 'file-check-2',
      desbloqueada: dados.feedbacksComComentario >= 1,
      progressoAtual: Math.min(1, dados.feedbacksComComentario),
      progressoTotal: 1,
    },
    {
      id: 'planejamento-claro',
      titulo: 'Planejamento Claro',
      descricao: 'Cadastrou 3 ou mais atividades organizadas em uma turma',
      icone: 'calendar-check',
      desbloqueada: dados.atividadesPorTurma >= 3,
      progressoAtual: Math.min(3, dados.atividadesPorTurma),
      progressoTotal: 3,
    },
    {
      id: 'turma-em-dia',
      titulo: 'Turma em Dia',
      descricao: 'Avaliou 100% das entregas enviadas de uma atividade',
      icone: 'check-check',
      desbloqueada: dados.teveAtividadeComTodasAvaliadas,
      progressoAtual: dados.teveAtividadeComTodasAvaliadas ? 1 : 0,
      progressoTotal: 1,
    },
    {
      id: 'diversidade-didatica',
      titulo: 'Diversidade Didática',
      descricao: 'Cadastrou ao menos dois tipos distintos de atividades',
      icone: 'layers',
      desbloqueada: dados.tiposDistintos >= 2,
      progressoAtual: Math.min(2, dados.tiposDistintos),
      progressoTotal: 2,
    },
  ];

  return {
    nivelDocente,
    tituloNivel,
    avaliacoesRealizadas: dados.avaliacoesRealizadas,
    turmasLecionadas: dados.turmasLecionadas,
    feedbacksComComentario: dados.feedbacksComComentario,
    respostasNoMural: dados.respostasNoMural,
    conquistas,
  };
}


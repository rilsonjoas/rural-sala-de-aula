/** Janela em que o prazo final conta como "perto": 48 horas (decisão de produto de 2026-10-12). */
export const JANELA_URGENTE_MS = 48 * 60 * 60 * 1000;

export type Urgencia = 'BREVE' | 'ENCERRADO';

/**
 * Só apresentação: não entra no estado da atividade (ADR-0005), que continua derivado de entrega,
 * avaliação e prazo final. BREVE = faltam 48 h ou menos; ENCERRADO = o prazo final já passou.
 */
export function urgenciaDoPrazo(prazoFinalIso: string, agora: Date = new Date()): Urgencia | null {
  const restante = new Date(prazoFinalIso).getTime() - agora.getTime();
  if (restante < 0) return 'ENCERRADO';
  return restante <= JANELA_URGENTE_MS ? 'BREVE' : null;
}

/** Aluno: só quem ainda não entregou tem pressa. Atrasada já é vermelho; entregue não precisa de alarme. */
export function alunoComPressa(
  atividade: { estado?: string | null; prazoFinal: string },
  agora: Date = new Date(),
): boolean {
  return atividade.estado === 'PENDENTE' && urgenciaDoPrazo(atividade.prazoFinal, agora) === 'BREVE';
}

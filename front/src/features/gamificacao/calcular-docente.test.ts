import { describe, expect, it } from 'vitest';
import { calcularDocente, obterTituloNivelDocente } from './calcular-docente';

describe('calcularDocente', () => {
  it('retorna nível 1 (Professor Iniciante) quando não há avaliações', () => {
    const perfil = calcularDocente({
      turmasLecionadas: 1,
      atividadesPorTurma: 0,
      tiposDistintos: 0,
      avaliacoesRealizadas: 0,
      feedbacksComComentario: 0,
      respostasNoMural: 0,
      teveAtividadeComTodasAvaliadas: false,
    });

    expect(perfil.nivelDocente).toBe(1);
    expect(perfil.tituloNivel).toBe('Professor Iniciante');
    expect(perfil.turmasLecionadas).toBe(1);
    expect(perfil.avaliacoesRealizadas).toBe(0);
    expect(perfil.conquistas.every((c) => !c.desbloqueada)).toBe(true);
  });

  it('calcula níveis de orientação conforme avaliações realizadas', () => {
    expect(obterTituloNivelDocente(1)).toBe('Professor Iniciante');
    expect(obterTituloNivelDocente(2)).toBe('Professor Orientador');
    expect(obterTituloNivelDocente(3)).toBe('Professor Mentor');
    expect(obterTituloNivelDocente(4)).toBe('Professor Emérito');
    expect(obterTituloNivelDocente(5)).toBe('Professor Emérito');

    // 10 avaliações -> nível 2
    const p10 = calcularDocente({
      turmasLecionadas: 1,
      atividadesPorTurma: 2,
      tiposDistintos: 1,
      avaliacoesRealizadas: 10,
      feedbacksComComentario: 0,
      respostasNoMural: 0,
      teveAtividadeComTodasAvaliadas: false,
    });
    expect(p10.nivelDocente).toBe(2);
    expect(p10.tituloNivel).toBe('Professor Orientador');

    // 25 avaliações -> nível 3
    const p25 = calcularDocente({
      turmasLecionadas: 2,
      atividadesPorTurma: 3,
      tiposDistintos: 2,
      avaliacoesRealizadas: 25,
      feedbacksComComentario: 5,
      respostasNoMural: 2,
      teveAtividadeComTodasAvaliadas: true,
    });
    expect(p25.nivelDocente).toBe(3);
    expect(p25.tituloNivel).toBe('Professor Mentor');
  });

  it('desbloqueia conquistas docentes conforme critérios pedagógicos', () => {
    const perfil = calcularDocente({
      turmasLecionadas: 2,
      atividadesPorTurma: 3,
      tiposDistintos: 2,
      avaliacoesRealizadas: 12,
      feedbacksComComentario: 2,
      respostasNoMural: 3,
      teveAtividadeComTodasAvaliadas: true,
    });

    const idsDesbloqueadas = perfil.conquistas
      .filter((c) => c.desbloqueada)
      .map((c) => c.id);

    expect(idsDesbloqueadas).toEqual([
      'dialogo-aberto',
      'feedback-completo',
      'planejamento-claro',
      'turma-em-dia',
      'diversidade-didatica',
    ]);
  });
});


import { describe, expect, it } from 'vitest';
import { destinoDaNotificacao } from './destino';

const base = {
  id: 'n1',
  tipo: 'AVISO_NOVO' as const,
  texto: 't',
  turmaId: 'turma-1',
  atividadeId: null,
  avisoId: null,
  criadaEm: '2026-11-05T12:00:00Z',
  lida: false,
  paraProfessor: false,
};

describe('destinoDaNotificacao', () => {
  it('aviso leva ao mural da turma', () => {
    expect(destinoDaNotificacao({ ...base, avisoId: 'av-1' })).toBe('/turmas/turma-1?aba=mural');
  });

  it('atividade leva ao detalhe do aluno', () => {
    expect(destinoDaNotificacao({ ...base, tipo: 'ATIVIDADE_NOVA', atividadeId: 'at-1' })).toBe('/atividades/at-1');
  });

  it('atividade para o professor leva às entregas', () => {
    expect(destinoDaNotificacao({ ...base, tipo: 'COMENTARIO_NOVO', atividadeId: 'at-1', paraProfessor: true })).toBe(
      '/atividades/at-1/entregas',
    );
  });

  it('sem aviso nem atividade leva à turma', () => {
    expect(destinoDaNotificacao(base)).toBe('/turmas/turma-1');
  });
});

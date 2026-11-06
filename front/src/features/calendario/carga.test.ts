import { describe, expect, it } from 'vitest';
import type { Atividade } from '@/features/atividades/filtros';
import { agruparPorSemana, cargaDaSemana, inicioDaSemana } from './carga';

const atividade = (id: string, prazoFinal: string): Atividade =>
  ({ id, nome: id, prazoFinal, tipo: 'PROVA', turmaId: 't', turmaNome: 'T', disponivelEm: '2026-01-01T00:00:00', aceitaAtraso: true }) as Atividade;

describe('inicioDaSemana', () => {
  it('devolve a segunda-feira às 00:00 da semana, mesmo se a data for domingo', () => {
    // 08/11/2026 é domingo; a semana começa em 02/11 (segunda)
    expect(inicioDaSemana(new Date(2026, 10, 8, 15, 30))).toEqual(new Date(2026, 10, 2, 0, 0, 0, 0));
    expect(inicioDaSemana(new Date(2026, 10, 2, 0, 0))).toEqual(new Date(2026, 10, 2, 0, 0, 0, 0));
  });
});

describe('cargaDaSemana', () => {
  it('classifica só pela quantidade: 0 livre, 1 e 2 média, 3 ou mais pesada', () => {
    expect([0, 1, 2, 3, 7].map(cargaDaSemana)).toEqual(['LIVRE', 'MEDIA', 'MEDIA', 'PESADA', 'PESADA']);
  });
});

describe('agruparPorSemana', () => {
  it('devolve a quantidade de semanas pedida, com as atividades pelo prazo e semanas vazias livres', () => {
    const inicio = new Date(2026, 10, 2); // seg 02/11
    const semanas = agruparPorSemana(
      [
        atividade('c', new Date(2026, 10, 4, 10).toISOString()), // qua da 1a semana
        atividade('a', new Date(2026, 10, 3, 9).toISOString()), // ter da 1a semana
        atividade('d', new Date(2026, 10, 8, 23, 59).toISOString()), // dom: ainda 1a semana
        atividade('e', new Date(2026, 10, 9, 0, 0).toISOString()), // seg: 2a semana
        atividade('fora', new Date(2026, 11, 20).toISOString()), // depois da janela
      ],
      inicio,
      3,
    );

    expect(semanas).toHaveLength(3);
    expect(semanas[0].atividades.map((x) => x.id)).toEqual(['a', 'c', 'd']);
    expect(semanas[0].carga).toBe('PESADA');
    expect(semanas[1].atividades.map((x) => x.id)).toEqual(['e']);
    expect(semanas[1].carga).toBe('MEDIA');
    expect(semanas[2].atividades).toEqual([]);
    expect(semanas[2].carga).toBe('LIVRE');
    expect(semanas[2].inicio).toEqual(new Date(2026, 10, 16));
  });
});

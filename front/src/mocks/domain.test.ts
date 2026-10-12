import { describe, expect, it } from 'vitest';
import {
  CODIGO_ALFABETO,
  estadoDaAtividade,
  filtrarEOrdenarAtividades,
  gerarCodigo,
  type AtividadeDb,
} from './domain';

const DIA = 24 * 60 * 60 * 1000;
const agora = new Date('2026-10-13T12:00:00Z');
const em = (dias: number) => new Date(agora.getTime() + dias * DIA).toISOString();

function atividade(parcial: Partial<AtividadeDb> = {}): AtividadeDb {
  return {
    id: 'a1',
    turmaId: 't1',
    nome: 'Lista',
    complexidade: 'MEDIA',
    tipo: 'ATIVIDADE',
    modalidade: 'INDIVIDUAL',
    prazoFinal: em(2),
    disponivelEm: em(-5),
    ...parcial,
  };
}

describe('estadoDaAtividade (derivado do prazo final)', () => {
  it('sem entrega e antes do prazo: PENDENTE', () => {
    expect(estadoDaAtividade(atividade(), undefined, undefined, agora)).toBe('PENDENTE');
  });

  it('sem entrega e depois do prazo: ATRASADA', () => {
    expect(estadoDaAtividade(atividade({ prazoFinal: em(-1) }), undefined, undefined, agora)).toBe('ATRASADA');
  });

  it('entregue antes do prazo final: ENTREGUE', () => {
    const entrega = { enviadaEm: em(-1) };
    expect(estadoDaAtividade(atividade({ prazoFinal: em(2) }), entrega, undefined, agora)).toBe('ENTREGUE');
  });

  it('entregue depois do prazo final: ENTREGUE_COM_ATRASO', () => {
    const entrega = { enviadaEm: em(-1) };
    expect(estadoDaAtividade(atividade({ prazoFinal: em(-3) }), entrega, undefined, agora)).toBe('ENTREGUE_COM_ATRASO');
  });

  it('entrega avaliada: CONCLUIDA, mesmo que tenha sido com atraso', () => {
    const entrega = { enviadaEm: em(-1) };
    expect(estadoDaAtividade(atividade({ prazoFinal: em(-3) }), entrega, { nota: 8 }, agora)).toBe('CONCLUIDA');
  });
});

describe('gerarCodigo', () => {
  it('tem 6 caracteres e nunca usa os ambíguos 0, O, 1, I, L', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigo([]);
      expect(codigo).toHaveLength(6);
      expect(codigo).toMatch(/^[A-Z2-9]{6}$/);
      expect(codigo).not.toMatch(/[01OIL]/);
    }
    expect(CODIGO_ALFABETO).not.toMatch(/[01OIL]/);
  });

  it('não repete um código existente (sem diferenciar maiúsculas)', () => {
    const existentes = ['ABC234'];
    const novos = new Set(Array.from({ length: 100 }, () => gerarCodigo(existentes)));

    expect(novos.has('ABC234')).toBe(false);
  });
});

describe('filtrarEOrdenarAtividades', () => {
  const lista = [
    { ...atividade({ id: 'a', complexidade: 'BAIXA', tipo: 'ATIVIDADE', modalidade: 'INDIVIDUAL', prazoFinal: em(5) }), estado: 'PENDENTE' as const },
    { ...atividade({ id: 'b', complexidade: 'ALTA', tipo: 'TRABALHO', modalidade: 'GRUPO', prazoFinal: em(1) }), estado: 'PENDENTE' as const },
    { ...atividade({ id: 'c', complexidade: 'MEDIA', tipo: 'PROVA', modalidade: 'INDIVIDUAL', prazoFinal: em(-2) }), estado: 'ATRASADA' as const },
  ];
  const ids = (resultado: { id: string }[]) => resultado.map((x) => x.id);

  it('por padrão ordena pelo prazo final mais próximo (as atrasadas vêm primeiro)', () => {
    expect(ids(filtrarEOrdenarAtividades(lista, {}))).toEqual(['c', 'b', 'a']);
  });

  it('ordena pelo prazo mais distante', () => {
    expect(ids(filtrarEOrdenarAtividades(lista, { ordenar: 'prazo', direcao: 'desc' }))).toEqual(['a', 'b', 'c']);
  });

  it('ordena da maior para a menor complexidade', () => {
    expect(ids(filtrarEOrdenarAtividades(lista, { ordenar: 'complexidade', direcao: 'desc' }))).toEqual(['b', 'c', 'a']);
  });

  it('filtra por estado, tipo, modalidade e complexidade', () => {
    expect(ids(filtrarEOrdenarAtividades(lista, { estado: 'ATRASADA' }))).toEqual(['c']);
    expect(ids(filtrarEOrdenarAtividades(lista, { tipo: 'TRABALHO' }))).toEqual(['b']);
    expect(ids(filtrarEOrdenarAtividades(lista, { modalidade: 'GRUPO' }))).toEqual(['b']);
    expect(ids(filtrarEOrdenarAtividades(lista, { complexidade: 'BAIXA' }))).toEqual(['a']);
  });

  it('combina filtros (E lógico)', () => {
    expect(ids(filtrarEOrdenarAtividades(lista, { estado: 'PENDENTE', modalidade: 'INDIVIDUAL' }))).toEqual(['a']);
    expect(ids(filtrarEOrdenarAtividades(lista, { estado: 'ATRASADA', tipo: 'TRABALHO' }))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { alunoComPressa, urgenciaDoPrazo } from './urgencia';

const agora = new Date('2026-10-12T12:00:00Z');
const emHoras = (h: number) => new Date(agora.getTime() + h * 3_600_000).toISOString();

describe('urgenciaDoPrazo', () => {
  it('prazo em mais de 48 h não tem urgência', () => {
    expect(urgenciaDoPrazo(emHoras(48.01), agora)).toBeNull();
    expect(urgenciaDoPrazo(emHoras(24 * 30), agora)).toBeNull();
  });

  it('48 h exatas ou menos é BREVE, inclusive o próprio instante do prazo', () => {
    expect(urgenciaDoPrazo(emHoras(48), agora)).toBe('BREVE');
    expect(urgenciaDoPrazo(emHoras(2), agora)).toBe('BREVE');
    expect(urgenciaDoPrazo(emHoras(0), agora)).toBe('BREVE');
  });

  it('prazo que já passou é ENCERRADO', () => {
    expect(urgenciaDoPrazo(emHoras(-0.01), agora)).toBe('ENCERRADO');
    expect(urgenciaDoPrazo(emHoras(-100), agora)).toBe('ENCERRADO');
  });
});

describe('alunoComPressa', () => {
  it('só vale para PENDENTE dentro da janela', () => {
    expect(alunoComPressa({ estado: 'PENDENTE', prazoFinal: emHoras(10) }, agora)).toBe(true);
    expect(alunoComPressa({ estado: 'PENDENTE', prazoFinal: emHoras(72) }, agora)).toBe(false);
  });

  it('atrasada, entregue, concluída e professor (sem estado) não ganham o alerta de aluno', () => {
    for (const estado of ['ATRASADA', 'ENTREGUE', 'ENTREGUE_COM_ATRASO', 'CONCLUIDA']) {
      expect(alunoComPressa({ estado, prazoFinal: emHoras(10) }, agora)).toBe(false);
    }
    expect(alunoComPressa({ prazoFinal: emHoras(10) }, agora)).toBe(false);
  });
});

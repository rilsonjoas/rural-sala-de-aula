import { describe, expect, it } from 'vitest';
import { formatData, formatDataHora, formatDias, formatNota, formatPrazoRelativo, formatTamanho, iniciais, paraInputDataHora, plural } from './format';

// Datas locais (e não UTC) para o teste valer em qualquer fuso do computador.
const local = (ano: number, mes: number, dia: number, h = 12, min = 0) => new Date(ano, mes - 1, dia, h, min);

describe('iniciais', () => {
  it('usa a primeira e a última palavra do nome', () => {
    expect(iniciais('Maria Clara Albuquerque')).toBe('MA');
    expect(iniciais('Lucas Mendes')).toBe('LM');
  });

  it('com uma palavra só, usa as duas primeiras letras', () => {
    expect(iniciais('Madonna')).toBe('MA');
  });

  it('ignora espaços sobrando e põe em maiúsculas', () => {
    expect(iniciais('  ana  souza ')).toBe('AS');
  });

  it('não quebra com nome vazio', () => {
    expect(iniciais('')).toBe('?');
    expect(iniciais('   ')).toBe('?');
  });
});

describe('formatDataHora', () => {
  const agora = local(2026, 10, 9);

  it('mostra dia/mês e hora, sem o ano quando é o ano atual', () => {
    expect(formatDataHora(local(2026, 10, 15, 23, 59).toISOString(), agora)).toBe('15/10 às 23:59');
  });

  it('inclui o ano quando é diferente do atual', () => {
    expect(formatDataHora(local(2027, 10, 15, 23, 59).toISOString(), agora)).toBe('15/10/2027 às 23:59');
  });

  it('completa com zero à esquerda', () => {
    expect(formatDataHora(local(2026, 3, 5, 8, 5).toISOString(), agora)).toBe('05/03 às 08:05');
  });
});

describe('formatNota', () => {
  it('usa vírgula e uma casa decimal', () => {
    expect(formatNota(9.5)).toBe('9,5');
    expect(formatNota(8)).toBe('8,0');
    expect(formatNota(10)).toBe('10,0');
    expect(formatNota(0)).toBe('0,0');
  });
});

describe('formatDias', () => {
  it('escreve os dias por extenso abreviado, em ordem, separados por ponto médio', () => {
    expect(formatDias([1, 3])).toBe('Seg · Qua');
    expect(formatDias([6, 7])).toBe('Sáb · Dom');
    expect(formatDias([5, 2, 4])).toBe('Ter · Qui · Sex');
  });

  it('não repete dia e devolve vazio sem dias', () => {
    expect(formatDias([3, 3, 1])).toBe('Seg · Qua');
    expect(formatDias([])).toBe('');
  });
});

describe('formatPrazoRelativo', () => {
  const agora = local(2026, 10, 13, 10, 0);

  it('conta os dias que restam pelo calendário', () => {
    expect(formatPrazoRelativo(local(2026, 10, 15, 23, 59).toISOString(), agora)).toBe('Restam 2 dias');
    expect(formatPrazoRelativo(local(2026, 10, 14, 23, 59).toISOString(), agora)).toBe('Resta 1 dia');
  });

  it('avisa quando o prazo é hoje e ainda não passou', () => {
    expect(formatPrazoRelativo(local(2026, 10, 13, 23, 59).toISOString(), agora)).toBe('Prazo final hoje');
  });

  it('diz há quantos dias o prazo passou', () => {
    expect(formatPrazoRelativo(local(2026, 10, 12, 8, 0).toISOString(), agora)).toBe('Prazo final passou há 1 dia');
    expect(formatPrazoRelativo(local(2026, 10, 10, 8, 0).toISOString(), agora)).toBe('Prazo final passou há 3 dias');
  });

  it('diz que passou hoje quando venceu algumas horas atrás', () => {
    expect(formatPrazoRelativo(local(2026, 10, 13, 8, 0).toISOString(), agora)).toBe('Prazo final passou hoje');
  });
});

describe('formatData', () => {
  const agora = local(2026, 10, 9);

  it('mostra só dia/mês no ano atual e inclui o ano nos outros', () => {
    expect(formatData(local(2026, 10, 20).toISOString(), agora)).toBe('20/10');
    expect(formatData(local(2027, 1, 5).toISOString(), agora)).toBe('05/01/2027');
  });
});

describe('paraInputDataHora', () => {
  it('formata a data local como o campo datetime-local espera', () => {
    expect(paraInputDataHora(local(2026, 3, 5, 8, 5))).toBe('2026-03-05T08:05');
    expect(paraInputDataHora(local(2030, 12, 31, 23, 59))).toBe('2030-12-31T23:59');
  });
});

describe('plural', () => {
  it('concorda com o número', () => {
    expect(plural(1, 'turma')).toBe('1 turma');
    expect(plural(3, 'turma')).toBe('3 turmas');
    expect(plural(0, 'pendente')).toBe('0 pendentes');
    expect(plural(2, 'mês', 'meses')).toBe('2 meses');
  });
});

describe('formatTamanho', () => {
  it('escolhe a unidade e usa vírgula decimal', () => {
    expect(formatTamanho(512)).toBe('512 B');
    expect(formatTamanho(950 * 1024)).toBe('950 KB');
    expect(formatTamanho(1800 * 1024)).toBe('1,8 MB');
    expect(formatTamanho(25 * 1024 * 1024)).toBe('25,0 MB');
  });
});

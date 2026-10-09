import { describe, expect, it } from 'vitest';
import { iniciais } from './format';

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

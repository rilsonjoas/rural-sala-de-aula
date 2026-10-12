import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComplexidadeIndicator } from './complexidade-indicator';

describe('ComplexidadeIndicator', () => {
  it.each([
    ['BAIXA', 'Complexidade baixa', 1],
    ['MEDIA', 'Complexidade média', 2],
    ['ALTA', 'Complexidade alta', 3],
  ] as const)('%s mostra o texto "%s" e %i barra(s) preenchida(s)', (nivel, texto, preenchidas) => {
    const { container } = render(<ComplexidadeIndicator nivel={nivel} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
    const barras = container.querySelectorAll('[data-barra]');
    expect(barras).toHaveLength(3);
    expect(container.querySelectorAll('[data-barra="cheia"]')).toHaveLength(preenchidas);
  });

  it('não usa verde, amarelo nem vermelho nas barras', () => {
    const { container } = render(<ComplexidadeIndicator nivel="ALTA" />);

    expect(container.innerHTML).not.toMatch(/bg-(success|highlight|destructive)/);
  });
});

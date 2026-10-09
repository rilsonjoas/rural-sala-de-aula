import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NomeDeArquivo } from './nome-de-arquivo';

describe('NomeDeArquivo', () => {
  it('mostra o nome completo, sem alterar o texto', () => {
    render(<NomeDeArquivo nome="exercicios_avl_lucas.pdf" />);

    expect(screen.getByText('exercicios_avl_lucas.pdf')).toBeInTheDocument();
  });

  it('oferece pontos de quebra depois de _, . e - (para não partir no meio de uma palavra)', () => {
    const { container } = render(<NomeDeArquivo nome="relatorio-final_v2.pdf" />);

    expect(container.querySelectorAll('wbr')).toHaveLength(3);
  });
});

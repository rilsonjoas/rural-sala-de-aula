import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it.each([
    ['PENDENTE', 'Pendente'],
    ['ENTREGUE', 'Entregue'],
    ['ENTREGUE_COM_ATRASO', 'Entregue com atraso'],
    ['ATRASADA', 'Atrasada'],
  ] as const)('%s mostra o texto "%s" e um ícone', (estado, texto) => {
    const { container } = render(<StatusBadge estado={estado} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('CONCLUIDA mostra a nota com vírgula quando há nota', () => {
    render(<StatusBadge estado="CONCLUIDA" nota={9.5} />);

    expect(screen.getByText('Concluída · nota 9,5')).toBeInTheDocument();
  });

  it('CONCLUIDA sem nota mostra só "Concluída"', () => {
    render(<StatusBadge estado="CONCLUIDA" />);

    expect(screen.getByText('Concluída')).toBeInTheDocument();
  });

  it('Atrasada é o único selo com fundo vermelho sólido', () => {
    const { container: atrasada } = render(<StatusBadge estado="ATRASADA" />);
    const { container: entregueComAtraso } = render(<StatusBadge estado="ENTREGUE_COM_ATRASO" />);

    expect(atrasada.firstElementChild).toHaveClass('bg-destructive');
    expect(entregueComAtraso.firstElementChild).not.toHaveClass('bg-destructive');
  });
});

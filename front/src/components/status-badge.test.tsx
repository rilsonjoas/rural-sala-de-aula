import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrazoBadge, StatusBadge } from './status-badge';

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

  it('PENDENTE urgente vira "Vence em breve", com ícone e fundo âmbar', () => {
    const { container } = render(<StatusBadge estado="PENDENTE" urgente />);

    expect(screen.getByText('Vence em breve')).toHaveClass('bg-highlight');
    expect(screen.queryByText('Pendente')).not.toBeInTheDocument();
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('urgente só muda o selo de PENDENTE', () => {
    render(<StatusBadge estado="ATRASADA" urgente />);

    expect(screen.getByText('Atrasada')).toBeInTheDocument();
    expect(screen.queryByText('Vence em breve')).not.toBeInTheDocument();
  });
});

describe('PrazoBadge (professor)', () => {
  it('BREVE mostra "Vence em breve" em âmbar', () => {
    render(<PrazoBadge urgencia="BREVE" />);

    expect(screen.getByText('Vence em breve')).toHaveClass('bg-highlight');
  });

  it('ENCERRADO mostra "Prazo encerrado" em cinza, sem alarme', () => {
    render(<PrazoBadge urgencia="ENCERRADO" />);

    const selo = screen.getByText('Prazo encerrado');
    expect(selo).toHaveClass('bg-secondary');
    expect(selo).not.toHaveClass('bg-destructive');
  });

  it('sem urgência não mostra nada', () => {
    const { container } = render(<PrazoBadge urgencia={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});

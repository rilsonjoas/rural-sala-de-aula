import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

describe('EmptyState', () => {
  it('mostra a mensagem e a ação que ensina o próximo passo', () => {
    render(
      <EmptyState
        mensagem="Você ainda não criou turmas."
        acao={<button type="button">Nova turma</button>}
      />,
    );

    expect(screen.getByText('Você ainda não criou turmas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova turma' })).toBeInTheDocument();
  });

  it('funciona sem ação', () => {
    render(<EmptyState mensagem="Nenhum aluno entregou ainda." />);

    expect(screen.getByText('Nenhum aluno entregou ainda.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('é um alerta com a mensagem e o botão Tentar de novo', async () => {
    const aoTentar = vi.fn();
    render(<ErrorState mensagem="Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo." onRetry={aoTentar} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar suas turmas.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(aoTentar).toHaveBeenCalledTimes(1);
  });

  it('tem mensagem padrão quando nenhuma é dada', () => {
    render(<ErrorState onRetry={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado. Tente de novo.');
  });
});

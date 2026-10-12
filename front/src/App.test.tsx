import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';

afterEach(() => cleanup());

describe('App', () => {
  it('a tela de entrada não tem cabeçalho nem navegação do app', async () => {
    renderApp('/entrar');

    await screen.findByRole('heading', { name: 'Entrar', level: 2 });
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
  });

  it('não mostra andaime de desenvolvimento ao usuário', async () => {
    renderApp('/entrar');

    await screen.findByRole('heading', { name: 'Entrar', level: 2 });
    expect(screen.queryByText(/API/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Em construção/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19\/10/)).not.toBeInTheDocument();
  });
});

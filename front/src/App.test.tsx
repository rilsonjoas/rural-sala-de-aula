import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';

afterEach(() => cleanup());

describe('App', () => {
  it('mostra a marca e a navegação', async () => {
    renderApp('/entrar');

    expect(await screen.findByRole('heading', { name: 'Rural Sala de Aula', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', '/turmas');
    expect(screen.getByRole('link', { name: 'Atividades' })).toHaveAttribute('href', '/atividades');
  });

  it('não mostra andaime de desenvolvimento ao usuário', async () => {
    renderApp('/entrar');

    await screen.findByRole('heading', { name: 'Entrar', level: 2 });
    expect(screen.queryByText(/API/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Em construção/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19\/10/)).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the brand and the navigation for the P1 areas', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Rural Sala de Aula', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', '/turmas');
    expect(screen.getByRole('link', { name: 'Atividades' })).toHaveAttribute('href', '/atividades');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
  });

  it('sends the root path to Turmas', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
  });

  it('does not show development scaffolding to the user', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/API/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Em construção/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19\/10/)).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

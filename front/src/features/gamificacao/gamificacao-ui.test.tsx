import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

describe('Gamificação UI no Shell', () => {
  it('exibe a pílula de nível e XP no cabeçalho e abre o modal de conquistas ao clicar', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);

    renderApp('/turmas');

    // Pílula com o nível e XP
    const pilula = await screen.findByRole('button', {
      name: /Perfil acadêmico: Nível/i,
    });
    expect(pilula).toBeInTheDocument();

    // Clica na pílula para abrir o modal de conquistas
    await user.click(pilula);

    // Modal deve abrir com título e seções
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Nível \d · Estudante/i)).toBeInTheDocument();
    expect(screen.getByText(/Conquistas Acadêmicas/i)).toBeInTheDocument();
    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Pontualidade Rural')).toBeInTheDocument();
    expect(screen.getByText('Sempre Adiante')).toBeInTheDocument();
  });
});


import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

describe('Página de Conquistas (Aba na Navegação)', () => {
  it('mostra a aba Conquistas na navegação e abre a página com medalhas e progresso', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);

    renderApp('/turmas');

    // Link "Conquistas" na navegação
    const linkConquistas = await screen.findByRole('link', { name: 'Conquistas' });
    expect(linkConquistas).toBeInTheDocument();

    // Navega para a página de conquistas
    await user.click(linkConquistas);

    // Título da página
    expect(await screen.findByRole('heading', { name: 'Conquistas', level: 2 })).toBeInTheDocument();

    // Card de Nível e XP
    expect(screen.getByText(/Nível \d · Estudante/i)).toBeInTheDocument();
    expect(screen.getByText(/XP Acumulados/i)).toBeInTheDocument();
    expect(screen.getByText(/Progresso para o Nível/i)).toBeInTheDocument();

    // Medalhas acadêmicas
    expect(screen.getByText('Medalhas Acadêmicas')).toBeInTheDocument();
    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Pontualidade Rural')).toBeInTheDocument();
    expect(screen.getByText('Sempre Adiante')).toBeInTheDocument();
    expect(screen.getByText('Nota de Destaque')).toBeInTheDocument();
    expect(screen.getByText('Semestre em Dia')).toBeInTheDocument();
    expect(screen.getByText('Espírito de Equipe')).toBeInTheDocument();
  });
});

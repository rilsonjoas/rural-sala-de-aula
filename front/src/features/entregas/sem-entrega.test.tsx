import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ALUNA, A_LISTA_1, PROFESSOR } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

describe('Quem ainda não entregou (professor)', () => {
  it('lista os inscritos sem entrega com nome e e-mail', async () => {
    await entrarComo(PROFESSOR);
    renderApp(`/atividades/${A_LISTA_1}/entregas`);

    const secao = await screen.findByRole('region', { name: /Ainda não entregaram/ });
    expect(within(secao).getByText(ALUNA.nome)).toBeInTheDocument();
    expect(within(secao).getByText(ALUNA.email)).toBeInTheDocument();
  });

  it('o aluno não consegue abrir a tela de entregas', async () => {
    await entrarComo(ALUNA);
    renderApp(`/atividades/${A_LISTA_1}/entregas`);

    expect(screen.queryByRole('region', { name: /Ainda não entregaram/ })).not.toBeInTheDocument();
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirTurma(usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/turmas/${TURMA_A}`);
  await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 });
  return user;
}

describe('Sair da turma (RF03b)', () => {
  it('o aluno confirma, sai e volta para a lista sem a turma', async () => {
    const user = await abrirTurma(ALUNA);

    await user.click(screen.getByRole('button', { name: 'Sair da turma' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Sair da turma?' });
    expect(within(dialogo).getByText(/Para voltar, é só entrar de novo com o código/)).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Sair da turma' }));

    expect(await screen.findByRole('heading', { name: 'Minhas turmas', level: 2 })).toBeInTheDocument();
    expect(await screen.findByText('1 turma')).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /Turma A — Algoritmos/ })).not.toBeInTheDocument();
  });

  it('cancelar mantém o aluno na turma', async () => {
    const user = await abrirTurma(ALUNA);

    await user.click(screen.getByRole('button', { name: 'Sair da turma' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Turma A — Algoritmos', level: 2 })).toBeInTheDocument();
  });

  it('o professor não vê o botão', async () => {
    await abrirTurma(PROFESSOR);

    expect(screen.queryByRole('button', { name: 'Sair da turma' })).not.toBeInTheDocument();
  });
});

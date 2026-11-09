import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirEdicao() {
  const user = userEvent.setup();
  await entrarComo(PROFESSOR);
  renderApp(`/turmas/${TURMA_A}`);
  await user.click(await screen.findByRole('button', { name: /^Atividades/ }));
  await user.click(await screen.findByRole('button', { name: /^Editar Lista 1/ }));
  const folha = await screen.findByRole('dialog', { name: 'Editar atividade' });
  return { user, folha };
}

describe('Editar atividade (RF11)', () => {
  it('abre com os dados atuais, confirma e a lista mostra o novo nome', async () => {
    const { user, folha } = await abrirEdicao();

    expect(within(folha).getByLabelText('Nome da atividade')).toHaveValue('Lista 1 — Recursão e Divisão e Conquista');
    expect(within(folha).getByRole('radio', { name: 'Lista de Exercício' })).toBeChecked();

    const nome = within(folha).getByLabelText('Nome da atividade');
    await user.clear(nome);
    await user.type(nome, 'Lista 1 — revisada');
    await user.click(within(folha).getByRole('button', { name: 'Revisar alterações' }));

    expect(await within(folha).findByText(/Confira as mudanças/)).toBeInTheDocument();
    await user.click(within(folha).getByRole('button', { name: 'Confirmar e salvar' }));

    expect(await screen.findByText('Atividade atualizada')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('article', { name: /Lista 1 — revisada/ })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /Recursão e Divisão e Conquista/ })).not.toBeInTheDocument();
  });

  it('não aceita prazo final antes de a atividade ficar disponível', async () => {
    const { user, folha } = await abrirEdicao();

    fireEvent.change(within(folha).getByLabelText('Prazo final'), { target: { value: '2000-01-01T08:00' } });
    await user.click(within(folha).getByRole('button', { name: 'Revisar alterações' }));

    expect(await within(folha).findByText('O prazo final não pode ser antes de quando a atividade fica disponível.')).toBeInTheDocument();
  });

  it('o aluno não vê o botão Editar', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);
    renderApp(`/turmas/${TURMA_A}`);
    await user.click(await screen.findByRole('button', { name: /^Atividades/ }));
    await screen.findByRole('article', { name: /Lista 1/ });
    expect(screen.queryByRole('button', { name: /^Editar/ })).not.toBeInTheDocument();
  });
});

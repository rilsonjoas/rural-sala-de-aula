import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
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

async function abrirExclusaoDaConta(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Menu da conta' }));
  await user.click(await screen.findByRole('menuitem', { name: 'Excluir minha conta' }));
  return screen.findByRole('dialog', { name: 'Excluir minha conta?' });
}

describe('Excluir turma', () => {
  it('o professor confirma, a turma e o que depende dela somem e ele volta para a lista', async () => {
    const professor = await abrirTurma(PROFESSOR);

    await professor.click(await screen.findByRole('button', { name: 'Excluir turma' }));
    const folha = await screen.findByRole('dialog', { name: 'Excluir a turma?' });
    await professor.click(within(folha).getByRole('button', { name: 'Excluir turma' }));

    expect(await screen.findByRole('heading', { name: 'Minhas turmas' })).toBeInTheDocument();
    expect(db.turmas.some((t) => t.id === TURMA_A)).toBe(false);
    expect(db.atividades.some((a) => a.turmaId === TURMA_A)).toBe(false);
    expect(db.inscricoes.some((i) => i.turmaId === TURMA_A)).toBe(false);
    expect(screen.queryByText('Turma A — Algoritmos')).not.toBeInTheDocument();
  });

  it('o aluno não vê o botão de excluir, só o de sair da turma', async () => {
    await abrirTurma(ALUNA);

    expect(await screen.findByRole('button', { name: 'Sair da turma' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir turma' })).not.toBeInTheDocument();
  });
});

describe('Excluir a própria conta', () => {
  it('com a senha certa a conta some e a sessão termina', async () => {
    const user = await abrirTurma(ALUNA);
    const folha = await abrirExclusaoDaConta(user);

    await user.type(within(folha).getByLabelText('Sua senha'), ALUNA.senha);
    await user.click(within(folha).getByRole('button', { name: 'Excluir minha conta' }));

    expect(await screen.findByRole('tab', { name: 'Criar conta' })).toBeInTheDocument();
    expect(db.usuarios.some((u) => u.id === ALUNA.id)).toBe(false);
    expect(db.inscricoes.some((i) => i.alunoId === ALUNA.id)).toBe(false);
  });

  it('senha errada mostra o erro e a conta continua', async () => {
    const user = await abrirTurma(ALUNA);
    const folha = await abrirExclusaoDaConta(user);

    await user.type(within(folha).getByLabelText('Sua senha'), 'senha-errada-1');
    await user.click(within(folha).getByRole('button', { name: 'Excluir minha conta' }));

    expect(await within(folha).findByRole('alert')).toHaveTextContent('Senha incorreta');
    expect(db.usuarios.some((u) => u.id === ALUNA.id)).toBe(true);
  });

  it('quem ainda leciona turmas recebe o aviso para excluí-las antes', async () => {
    const user = await abrirTurma(PROFESSOR);
    const folha = await abrirExclusaoDaConta(user);

    await user.type(within(folha).getByLabelText('Sua senha'), PROFESSOR.senha);
    await user.click(within(folha).getByRole('button', { name: 'Excluir minha conta' }));

    expect(await within(folha).findByRole('alert')).toHaveTextContent(/Você leciona 2 turmas\. Exclua as turmas antes/);
    expect(db.usuarios.some((u) => u.id === PROFESSOR.id)).toBe(true);
  });
});

describe('Membros da turma', () => {
  it('lista o professor e os alunos inscritos, em ordem alfabética', async () => {
    const user = await abrirTurma(ALUNA);

    await user.click(await screen.findByRole('button', { name: 'Membros' }));

    const alunos = within(await screen.findByRole('list', { name: 'Alunos da turma' }));
    const nomes = alunos.getAllByRole('listitem').map((li) => li.querySelector('span:last-child')?.textContent);
    expect(nomes).toHaveLength(4);
    expect(nomes).toEqual([...nomes].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'pt-BR')));
    expect(screen.getByText('Alunos · 4 inscritos')).toBeInTheDocument();
    expect(screen.getByText('Paulo Silva')).toBeInTheDocument();
  });
});

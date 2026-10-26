import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirMural(usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/turmas/${TURMA_A}`);
  await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 });
  return user;
}

describe('Mural da turma', () => {
  it('o professor publica um aviso', async () => {
    const professor = await abrirMural(PROFESSOR);
    await professor.click(await screen.findByText('Escreva um comunicado para a turma...'));
    await professor.type(screen.getByPlaceholderText(/Escreva um comunicado ou orientação/), 'Prova adiada para sexta');
    await professor.click(screen.getByRole('button', { name: 'Postar' }));
    expect(await screen.findByText('Prova adiada para sexta')).toBeInTheDocument();
  });

  it('responder cria a resposta embaixo do comentário, com recuo', async () => {
    const user = await abrirMural(PROFESSOR);
    await user.click(await screen.findByText('Escreva um comunicado para a turma...'));
    await user.type(screen.getByPlaceholderText(/Escreva um comunicado ou orientação/), 'Aviso de teste');
    await user.click(screen.getByRole('button', { name: 'Postar' }));
    await screen.findByText('Aviso de teste');

    const cartao = within(screen.getByText('Aviso de teste').closest('article') as HTMLElement);

    await user.type(cartao.getByLabelText('Novo comentário'), 'Alguém tem dúvida?');
    await user.click(cartao.getByRole('button', { name: 'Enviar comentário' }));
    const raiz = await cartao.findByText('Alguém tem dúvida?');

    await user.click(cartao.getByRole('button', { name: /Responder a/ }));
    await user.type(cartao.getByLabelText(/^Resposta a /), 'Sim, sobre a lista 2');
    await user.click(cartao.getByRole('button', { name: 'Responder' }));

    const resposta = await cartao.findByText('Sim, sobre a lista 2');
    expect(cartao.getByText('2 comentários da turma')).toBeInTheDocument();
    // a resposta fica no bloco recuado do comentário original
    const bloco = resposta.closest('div.border-l-2') as HTMLElement;
    expect(bloco).not.toBeNull();
    expect(within(bloco).queryByText('Alguém tem dúvida?')).not.toBeInTheDocument();
    expect(raiz.closest('div.border-l-2')).toBeNull();
  });

  it('aluno não vê a caixa de publicar, mas vê o Responder', async () => {
    await abrirMural(ALUNA);
    await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 });
    expect(screen.queryByText('Escreva um comunicado para a turma...')).not.toBeInTheDocument();
  });
});

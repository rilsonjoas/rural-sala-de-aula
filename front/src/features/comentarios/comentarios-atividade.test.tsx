import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { ALUNA, A_LISTA_1, PROFESSOR } from '@/mocks/fixtures';
import { server } from '@/mocks/server';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrir(caminho: string, usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(caminho);
  return user;
}

const secao = () => screen.getByRole('region', { name: 'Dúvidas e comentários' });

describe('Comentários na atividade', () => {
  it('o aluno vê a lista vazia, comenta e o comentário aparece', async () => {
    const aluna = await abrir(`/atividades/${A_LISTA_1}`, ALUNA);

    expect(await screen.findByText('Ainda não há comentários.')).toBeInTheDocument();
    await aluna.type(within(secao()).getByLabelText('Novo comentário'), 'Posso entregar em dupla?');
    await aluna.click(within(secao()).getByRole('button', { name: 'Enviar comentário' }));

    expect(await within(secao()).findByText('Posso entregar em dupla?')).toBeInTheDocument();
    expect(screen.queryByText('Ainda não há comentários.')).not.toBeInTheDocument();
  });

  it('o professor responde ao comentário do aluno e a resposta fica sob o original', async () => {
    db.comentariosAtividade.push({
      id: 'c-1',
      avisoId: null,
      atividadeId: A_LISTA_1,
      comentarioPaiId: null,
      autorId: ALUNA.id,
      autorNome: ALUNA.nome,
      texto: 'Qual a nota de corte?',
      horario: new Date().toISOString(),
    });
    const professor = await abrir(`/atividades/${A_LISTA_1}/entregas`, PROFESSOR);

    await within(await screen.findByRole('region', { name: 'Dúvidas e comentários' })).findByText('Qual a nota de corte?');
    await professor.click(within(secao()).getByRole('button', { name: `Responder a ${ALUNA.nome}` }));
    await professor.type(within(secao()).getByLabelText(`Resposta a ${ALUNA.nome}`), 'Sete');
    await professor.click(within(secao()).getByRole('button', { name: 'Responder' }));

    const resposta = await within(secao()).findByText('Sete');
    expect(resposta.closest('div.border-l-2')).not.toBeNull();
  });

  it('mostra o estado de erro e tenta de novo', async () => {
    server.use(
      http.get('*/api/v1/atividades/:atividadeId/comentarios', () =>
        HttpResponse.json({ status: 500, message: 'Erro interno' }, { status: 500 }),
      ),
    );
    const aluna = await abrir(`/atividades/${A_LISTA_1}`, ALUNA);

    const alerta = await within(await screen.findByRole('region', { name: 'Dúvidas e comentários' })).findByRole('alert');
    server.resetHandlers();
    await aluna.click(within(alerta).getByRole('button', { name: /tentar de novo/i }));

    expect(await within(secao()).findByText('Ainda não há comentários.')).toBeInTheDocument();
  });

  it('o botão de enviar fica desabilitado com o texto em branco', async () => {
    const aluna = await abrir(`/atividades/${A_LISTA_1}`, ALUNA);
    await screen.findByText('Ainda não há comentários.');

    const enviar = within(secao()).getByRole('button', { name: 'Enviar comentário' });
    expect(enviar).toBeDisabled();
    await aluna.type(within(secao()).getByLabelText('Novo comentário'), '   ');
    expect(enviar).toBeDisabled();
  });
});

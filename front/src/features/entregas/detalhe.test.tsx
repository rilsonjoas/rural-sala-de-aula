import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import {
  ALUNA,
  ALUNO,
  A_LISTA_0,
  A_LISTA_1,
  A_LISTA_2,
  A_PROJETO,
  A_PROVA_1,
  A_TRABALHO_1,
  B_PRATICA_2,
} from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

const pdf = (nome = 'meu_trabalho.pdf', tamanho = 2048) => {
  const f = new File([new Uint8Array(16)], nome, { type: 'application/pdf' });
  Object.defineProperty(f, 'size', { value: tamanho });
  return f;
};

async function abrirDetalhe(atividadeId: string, usuario: { email: string; senha: string } = ALUNA, opcoes = {}) {
  const user = userEvent.setup(opcoes);
  await entrarComo(usuario);
  renderApp(`/atividades/${atividadeId}`);
  return user;
}

const secaoEntrega = () => screen.getByRole('region', { name: 'Sua entrega' });

describe('Detalhe da atividade (aluno)', () => {
  it('mostra título, turma e professor, tipo, prazo final e descrição', async () => {
    await abrirDetalhe(A_LISTA_1);

    expect(await screen.findByRole('heading', { name: 'Lista 1 — Recursão e Divisão e Conquista', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Turma A — Algoritmos · Prof. Paulo Silva')).toBeInTheDocument();
    expect(screen.getByText('Lista de Exercício')).toBeInTheDocument();
    expect(screen.getByText(/^Prazo final: \d{2}\/\d{2}(\/\d{4})? às \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Descrição' })).toBeInTheDocument();
    expect(screen.getByText(/Implementar soluções recursivas/)).toBeInTheDocument();
    expect(screen.queryByText('Prazo expirado')).not.toBeInTheDocument();
    expect(screen.queryByText(/Data limite regular|Tolerância final|Peso na média/)).not.toBeInTheDocument();
  });

  it('o link de voltar leva a Minhas atividades', async () => {
    await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });

    expect(within(screen.getByRole('main')).getByRole('link', { name: /Atividades/ })).toHaveAttribute('href', '/atividades');
  });

  it('depois do prazo final sem entrega: um só selo (Atrasada) e uma faixa informativa, sem alarme duplicado', async () => {
    await abrirDetalhe(A_LISTA_0);

    expect(await screen.findByText('Atrasada')).toBeInTheDocument();
    expect(screen.getByText('O prazo final passou. Você ainda pode enviar, mas a entrega será marcada com atraso.')).toBeInTheDocument();
    expect(screen.queryByText('Prazo expirado')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('atividade ainda não disponível ou de turma alheia: "Atividade não encontrada"', async () => {
    await abrirDetalhe(A_PROJETO);
    expect(await screen.findByText('Atividade não encontrada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para Turmas' })).toHaveAttribute('href', '/turmas');
  });

  it('aluno de fora da turma não vê a atividade', async () => {
    await abrirDetalhe(B_PRATICA_2, ALUNO);

    expect(await screen.findByText('Atividade não encontrada.')).toBeInTheDocument();
  });
});

describe('Sua entrega: sem entrega', () => {
  it('mostra o seletor de arquivo com a dica e o botão Enviar desabilitado', async () => {
    await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });

    const secao = within(secaoEntrega());
    expect(secao.getByText('Escolher arquivo')).toBeInTheDocument();
    expect(secao.getByText('PDF, apresentação ou texto, até 25 MB')).toBeInTheDocument();
    expect(secao.getByRole('button', { name: 'Enviar entrega' })).toBeDisabled();
    expect(secao.queryByText('Procurar no celular')).not.toBeInTheDocument();
  });

  it('ao escolher o arquivo mostra nome e tamanho, e permite remover', async () => {
    const user = await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });
    const secao = within(secaoEntrega());

    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('versao_final.pdf', 3 * 1024 * 1024));

    expect(secao.getByText('versao_final.pdf')).toBeInTheDocument();
    expect(secao.getByText('3,0 MB')).toBeInTheDocument();
    expect(secao.getByRole('button', { name: 'Enviar entrega' })).toBeEnabled();

    await user.click(secao.getByRole('button', { name: 'Remover' }));
    expect(secao.queryByText('versao_final.pdf')).not.toBeInTheDocument();
    expect(secao.getByRole('button', { name: 'Enviar entrega' })).toBeDisabled();
  });

  it('rejeita tipo de arquivo e arquivo grande na hora, sem escolher o arquivo', async () => {
    const user = await abrirDetalhe(A_LISTA_1, ALUNA, { applyAccept: false });
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });
    const secao = within(secaoEntrega());

    await user.upload(secao.getByLabelText('Escolher arquivo'), new File([new Uint8Array(4)], 'programa.exe'));
    expect(await secao.findByText('Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.')).toBeInTheDocument();
    expect(secao.getByRole('button', { name: 'Enviar entrega' })).toBeDisabled();

    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('enorme.pdf', 26 * 1024 * 1024));
    expect(await secao.findByText('O arquivo passa de 25 MB. Envie um arquivo menor.')).toBeInTheDocument();
    expect(secao.queryByText('enorme.pdf')).not.toBeInTheDocument();
  });

  it('envia: desabilita o botão com barra de progresso e depois mostra a entrega registrada', async () => {
    server.use(
      http.post('*/api/v1/atividades/:id/entregas', async ({ request }) => {
        await new Promise((r) => setTimeout(r, 120));
        const campo = (await request.formData()).get('arquivo') as File;
        return HttpResponse.json(
          {
            id: 'e-novo',
            atividadeId: A_LISTA_1,
            alunoId: ALUNA.id,
            alunoNome: ALUNA.nome,
            nomeOriginal: campo.name,
            tamanhoBytes: campo.size,
            enviadaEm: new Date().toISOString(),
            atrasada: false,
            nota: null,
            comentarioPrivado: null,
          },
          { status: 201 },
        );
      }),
    );
    const user = await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });
    const secao = within(secaoEntrega());
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('lista1.pdf'));

    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(secao.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(secao.getByRole('progressbar', { name: 'Enviando arquivo' })).toBeInTheDocument();
    expect(await screen.findByText('Entrega enviada.')).toBeInTheDocument();
  });

  it('a entrega registrada aparece com o nome, a data de envio e o selo; a atividade vira Entregue', async () => {
    const user = await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });
    const secao = within(secaoEntrega());
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('lista1.pdf'));
    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await within(secaoEntrega()).findByText('lista1.pdf')).toBeInTheDocument();
    // o botão de envio some: o foco vai para o título da seção, não se perde
    await waitFor(() => expect(within(secaoEntrega()).getByRole('heading', { name: 'Sua entrega' })).toHaveFocus());
    expect(within(secaoEntrega()).getByText(/^Enviada em \d{2}\/\d{2} às \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(within(secaoEntrega()).getByText('Entregue')).toBeInTheDocument();
    expect(within(secaoEntrega()).getByRole('button', { name: 'Enviar outro arquivo' })).toBeInTheDocument();
  });

  it('entrega depois do prazo final é aceita e fica "Entregue com atraso"', async () => {
    const user = await abrirDetalhe(A_LISTA_0);
    await screen.findByText('Atrasada');
    const secao = within(secaoEntrega());
    expect(secao.getByText('Ao enviar agora, a entrega será marcada com atraso.')).toBeInTheDocument();
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('atrasado.pdf'));
    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await within(secaoEntrega()).findByText('Entregue com atraso')).toBeInTheDocument();
  });

  it('erros da API aparecem no próprio bloco e o arquivo escolhido é mantido', async () => {
    server.use(
      http.post('*/api/v1/atividades/:id/entregas', () =>
        HttpResponse.json({ status: 413, message: 'O arquivo passa de 25 MB. Envie um arquivo menor.' }, { status: 413 }),
      ),
    );
    const user = await abrirDetalhe(A_LISTA_1);
    await screen.findByRole('heading', { name: /Lista 1/, level: 2 });
    const secao = within(secaoEntrega());
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('lista1.pdf'));

    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await secao.findByRole('alert')).toHaveTextContent('O arquivo passa de 25 MB. Envie um arquivo menor.');
    expect(secao.getByText('lista1.pdf')).toBeInTheDocument();
    expect(secao.getByRole('button', { name: 'Enviar entrega' })).toBeEnabled();
  });
});

describe('Sua entrega: já entregue', () => {
  it('mostra a entrega e deixa enviar outro arquivo, que substitui o anterior', async () => {
    const user = await abrirDetalhe(A_TRABALHO_1);
    await screen.findByRole('heading', { name: /Trabalho 1/, level: 2 });
    const secao = within(secaoEntrega());
    expect(secao.getByText('bst_maria.pdf')).toBeInTheDocument();
    expect(secao.getByText('3,0 MB')).toBeInTheDocument();

    await user.click(secao.getByRole('button', { name: 'Enviar outro arquivo' }));
    expect(secao.getByText('O novo arquivo substitui o anterior.')).toBeInTheDocument();
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('bst_v2.pdf'));
    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await within(secaoEntrega()).findByText('bst_v2.pdf')).toBeInTheDocument();
    expect(within(secaoEntrega()).queryByText('bst_maria.pdf')).not.toBeInTheDocument();
  });

  it('entregue depois do prazo mostra "Entregue com atraso"', async () => {
    await abrirDetalhe(A_LISTA_2);

    expect(await within(await screen.findByRole('region', { name: 'Sua entrega' })).findByText('Entregue com atraso')).toBeInTheDocument();
  });
});

describe('Sua entrega: avaliada', () => {
  it('mostra a nota e o comentário do professor, sem opção de reenviar', async () => {
    await abrirDetalhe(A_PROVA_1);
    await screen.findByRole('heading', { name: /Prova Teórica 1/, level: 2 });

    const secao = within(secaoEntrega());
    expect(secao.getByText('Concluída')).toBeInTheDocument();
    expect(secao.getByText('Nota 9,5')).toBeInTheDocument();
    expect(secao.getByText('Comentário do professor')).toBeInTheDocument();
    expect(secao.getByText('Parabéns! Só revisar a questão 4.')).toBeInTheDocument();
    expect(secao.queryByRole('button', { name: 'Enviar outro arquivo' })).not.toBeInTheDocument();
    expect(secao.getByText('Esta entrega já foi avaliada e não aceita novo envio.')).toBeInTheDocument();
  });
});

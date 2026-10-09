import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { api } from '@/lib/api-client';
import { ALUNA } from '@/mocks/fixtures';
import { renderApp } from '@/test/render';

async function abrirEntrar() {
  const usuario = userEvent.setup();
  renderApp('/entrar');
  await screen.findByRole('tab', { name: 'Entrar' });
  return usuario;
}

describe('Entrar', () => {
  it('mostra a marca, as duas abas e o formulário de login', async () => {
    await abrirEntrar();

    expect(screen.getByRole('heading', { name: 'Rural Sala de Aula', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Ambiente Virtual de Aprendizagem')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Entrar', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Criar conta', selected: false })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.queryByText('Esqueceu?')).not.toBeInTheDocument();
  });

  it('entra com credencial válida e vai para Turmas', async () => {
    const usuario = await abrirEntrar();

    await usuario.type(screen.getByLabelText('E-mail'), ALUNA.email);
    await usuario.type(screen.getByLabelText('Senha'), ALUNA.senha);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
    expect((await api.GET('/me')).data?.email).toBe(ALUNA.email);
  });

  it('com senha errada mostra a mensagem de erro e mantém o que foi digitado', async () => {
    const usuario = await abrirEntrar();

    await usuario.type(screen.getByLabelText('E-mail'), ALUNA.email);
    await usuario.type(screen.getByLabelText('Senha'), 'senhaerrada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos. Confira e tente de novo.');
    expect(screen.getByLabelText('E-mail')).toHaveValue(ALUNA.email);
  });

  it('avisa campos vazios no próprio campo', async () => {
    const usuario = await abrirEntrar();

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('valida o formato do e-mail ao sair do campo', async () => {
    const usuario = await abrirEntrar();

    await usuario.type(screen.getByLabelText('E-mail'), 'sem-arroba');
    await usuario.tab();

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
  });

  it('mostra e oculta a senha', async () => {
    const usuario = await abrirEntrar();
    const campo = screen.getByLabelText('Senha');
    expect(campo).toHaveAttribute('type', 'password');

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(campo).toHaveAttribute('type', 'text');

    await usuario.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(campo).toHaveAttribute('type', 'password');
  });

  it('desabilita o botão enquanto envia, para não duplicar', async () => {
    server.use(
      http.post('*/api/v1/auth/login', async () => {
        await delay(150);
        return HttpResponse.json({ status: 401, message: 'E-mail ou senha incorretos. Confira e tente de novo.' }, { status: 401 });
      }),
    );
    const usuario = await abrirEntrar();
    await usuario.type(screen.getByLabelText('E-mail'), ALUNA.email);
    await usuario.type(screen.getByLabelText('Senha'), ALUNA.senha);

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
});

describe('Entrar a partir de outra tela', () => {
  it('depois de entrar, volta para a tela que a pessoa tentou abrir', async () => {
    const usuario = userEvent.setup();
    renderApp('/atividades');
    await screen.findByRole('tab', { name: 'Entrar' });

    await usuario.type(screen.getByLabelText('E-mail'), ALUNA.email);
    await usuario.type(screen.getByLabelText('Senha'), ALUNA.senha);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Atividades', level: 2 })).toBeInTheDocument();
  });
});

describe('Criar conta', () => {
  async function abrirCriarConta() {
    const usuario = await abrirEntrar();
    await usuario.click(screen.getByRole('tab', { name: 'Criar conta' }));
    await screen.findByLabelText('Nome');
    return usuario;
  }

  it('mostra Nome, E-mail, Senha e o papel sem nada pré-marcado', async () => {
    await abrirCriarConta();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByText('Mínimo de 8 caracteres')).toBeInTheDocument();
    const grupo = screen.getByRole('radiogroup', { name: 'Eu sou' });
    expect(grupo).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Aluno/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /Professor/ })).not.toBeChecked();
    expect(screen.getByText('Entro em turmas e entrego atividades')).toBeInTheDocument();
    expect(screen.getByText('Crio turmas e avalio entregas')).toBeInTheDocument();
  });

  it('cria a conta de professor, já entra logado e vai para Turmas', async () => {
    const usuario = await abrirCriarConta();

    await usuario.type(screen.getByLabelText('Nome'), 'Ana Souza');
    await usuario.type(screen.getByLabelText('E-mail'), 'ana@ufrpe.br');
    await usuario.type(screen.getByLabelText('Senha'), 'senha1234');
    await usuario.click(screen.getByRole('radio', { name: /Professor/ }));
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
    expect((await api.GET('/me')).data).toMatchObject({ nome: 'Ana Souza', papel: 'PROFESSOR' });
  });

  it('exige escolher o papel', async () => {
    const usuario = await abrirCriarConta();

    await usuario.type(screen.getByLabelText('Nome'), 'Ana Souza');
    await usuario.type(screen.getByLabelText('E-mail'), 'ana@ufrpe.br');
    await usuario.type(screen.getByLabelText('Senha'), 'senha1234');
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Escolha como você vai usar o Rural Sala de Aula.')).toBeInTheDocument();
  });

  it('exige senha com no mínimo 8 caracteres', async () => {
    const usuario = await abrirCriarConta();

    await usuario.type(screen.getByLabelText('Senha'), 'curta');
    await usuario.tab();

    expect(await screen.findByText('A senha precisa ter no mínimo 8 caracteres.')).toBeInTheDocument();
  });

  it('e-mail já cadastrado aparece no campo de e-mail, com a orientação do desenho', async () => {
    const usuario = await abrirCriarConta();

    await usuario.type(screen.getByLabelText('Nome'), 'Outra Maria');
    await usuario.type(screen.getByLabelText('E-mail'), ALUNA.email);
    await usuario.type(screen.getByLabelText('Senha'), 'senha1234');
    await usuario.click(screen.getByRole('radio', { name: /Aluno/ }));
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Esse e-mail já está cadastrado. Entre ou use outro e-mail.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome')).toHaveValue('Outra Maria');
  });
});

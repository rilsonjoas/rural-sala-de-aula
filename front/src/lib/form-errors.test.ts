import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { aplicarErroDaApi } from './form-errors';

function formFalso() {
  return { setError: vi.fn() };
}

describe('aplicarErroDaApi', () => {
  it('põe cada erro por campo (422) no campo certo e não devolve mensagem geral', () => {
    const form = formFalso();
    const erro = new ApiError(422, 'Dados inválidos.', [
      { campo: 'nome', mensagem: 'Informe seu nome.' },
      { campo: 'email', mensagem: 'Informe um e-mail válido.' },
    ]);

    const geral = aplicarErroDaApi(form, erro);

    expect(form.setError).toHaveBeenCalledWith('nome', { type: 'server', message: 'Informe seu nome.' });
    expect(form.setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Informe um e-mail válido.' });
    expect(geral).toBeUndefined();
  });

  it('manda o 409 para o campo indicado', () => {
    const form = formFalso();
    const erro = new ApiError(409, 'Esse e-mail já está cadastrado. Entre ou use outro e-mail.');

    const geral = aplicarErroDaApi(form, erro, { campoPorStatus: { 409: 'email' } });

    expect(form.setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Esse e-mail já está cadastrado. Entre ou use outro e-mail.',
    });
    expect(geral).toBeUndefined();
  });

  it('mapeia também outros status, como o 404 de um código inexistente', () => {
    const form = formFalso();
    const erro = new ApiError(404, 'Não encontramos uma turma com esse código.');

    expect(aplicarErroDaApi(form, erro, { campoPorStatus: { 404: 'codigo' } })).toBeUndefined();
    expect(form.setError).toHaveBeenCalledWith('codigo', { type: 'server', message: 'Não encontramos uma turma com esse código.' });
  });

  it('devolve a mensagem para ser mostrada como erro geral quando não dá para ligar a um campo', () => {
    const form = formFalso();

    expect(aplicarErroDaApi(form, new ApiError(500, 'Erro interno.'))).toBe('Erro interno.');
    expect(aplicarErroDaApi(form, new ApiError(409, 'Conflito.'))).toBe('Conflito.');
    expect(form.setError).not.toHaveBeenCalled();
  });

  it('erro que não é da API vira a mensagem padrão', () => {
    expect(aplicarErroDaApi(formFalso(), new TypeError('Failed to fetch'))).toBe('Algo deu errado. Tente de novo.');
  });
});

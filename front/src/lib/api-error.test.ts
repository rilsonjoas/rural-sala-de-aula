import { describe, expect, it } from 'vitest';
import { ApiError, MENSAGEM_PADRAO, toApiError } from './api-error';

describe('toApiError', () => {
  it('converte um Problem em ApiError com status e mensagem', () => {
    const erro = toApiError(409, { status: 409, message: 'Esse e-mail já está cadastrado.' });

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(409);
    expect(erro.message).toBe('Esse e-mail já está cadastrado.');
    expect(erro.campos).toBeUndefined();
  });

  it('preserva os erros por campo de um 422', () => {
    const erro = toApiError(422, {
      status: 422,
      message: 'Dados inválidos.',
      campos: [{ campo: 'prazoFinal', mensagem: 'O prazo final não pode ser antes da disponibilidade.' }],
    });

    expect(erro.campos).toEqual([
      { campo: 'prazoFinal', mensagem: 'O prazo final não pode ser antes da disponibilidade.' },
    ]);
  });

  it('usa a mensagem padrão quando o corpo não é um Problem', () => {
    expect(toApiError(500, null).message).toBe(MENSAGEM_PADRAO);
    expect(toApiError(502, '<html>Bad Gateway</html>').message).toBe(MENSAGEM_PADRAO);
    expect(toApiError(500, { message: 42 }).message).toBe(MENSAGEM_PADRAO);
  });

  it('mantém o status mesmo sem corpo, para o 401 ser reconhecível', () => {
    expect(toApiError(401, undefined).status).toBe(401);
  });
});

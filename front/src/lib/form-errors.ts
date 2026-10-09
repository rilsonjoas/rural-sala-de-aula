import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError, MENSAGEM_PADRAO } from './api-error';

type OpcoesErro<T extends FieldValues> = { campoDoConflito?: FieldPath<T> };

/**
 * Leva um erro da API para o formulário: erros por campo (422) e o conflito (409) vão para o campo certo;
 * o que não der para ligar a um campo volta como mensagem, para ser mostrada como erro geral do formulário.
 */
export function aplicarErroDaApi<T extends FieldValues>(
  form: { setError: UseFormSetError<T> },
  erro: unknown,
  { campoDoConflito }: OpcoesErro<T> = {},
): string | undefined {
  if (!(erro instanceof ApiError)) return MENSAGEM_PADRAO;

  if (erro.campos?.length) {
    for (const { campo, mensagem } of erro.campos) {
      form.setError(campo as FieldPath<T>, { type: 'server', message: mensagem });
    }
    return undefined;
  }

  if (erro.status === 409 && campoDoConflito) {
    form.setError(campoDoConflito, { type: 'server', message: erro.message });
    return undefined;
  }

  return erro.message;
}

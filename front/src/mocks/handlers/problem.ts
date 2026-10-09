import { HttpResponse } from 'msw';
import type { components } from '@/lib/api.generated';

type Problem = components['schemas']['Problem'];

export function problem(status: number, message: string, campos?: Problem['campos']) {
  return HttpResponse.json<Problem>({ status, message, ...(campos ? { campos } : {}) }, { status });
}

export const naoAutenticado = () => problem(401, 'Não autenticado.');
export const proibido = (mensagem = 'Você não tem acesso a este recurso.') => problem(403, mensagem);
export const naoEncontrado = (mensagem = 'Não encontrado.') => problem(404, mensagem);
export const dadosInvalidos = (campos: NonNullable<Problem['campos']>) => problem(422, 'Dados inválidos.', campos);

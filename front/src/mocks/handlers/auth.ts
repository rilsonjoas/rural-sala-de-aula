import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, semSenha, usuarioDaSessao } from '../db';
import { naoAutenticado, problem } from './problem';

type RegisterRequest = components['schemas']['RegisterRequest'];
type LoginRequest = components['schemas']['LoginRequest'];
type Problem = components['schemas']['Problem'];

const API = '*/api/v1';

export const authHandlers = [
  http.get(`${API}/health`, () =>
    HttpResponse.json({
      status: 'ok',
      service: 'rural-sala-de-aula-api (simulada)',
      version: '0.0.0-mock',
      timestamp: new Date().toISOString(),
    }),
  ),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const corpo = (await request.json()) as RegisterRequest;
    const campos: NonNullable<Problem['campos']> = [];
    if (!corpo.nome?.trim()) campos.push({ campo: 'nome', mensagem: 'Informe seu nome.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corpo.email ?? '')) {
      campos.push({ campo: 'email', mensagem: 'Informe um e-mail válido.' });
    }
    if ((corpo.senha ?? '').length < 8) campos.push({ campo: 'senha', mensagem: 'A senha precisa ter no mínimo 8 caracteres.' });
    if (campos.length > 0) return problem(422, 'Dados inválidos.', campos);

    if (db.usuarios.some((u) => u.email.toLowerCase() === corpo.email.toLowerCase())) {
      return problem(409, 'Esse e-mail já está cadastrado. Entre ou use outro e-mail.');
    }

    const novo = {
      id: crypto.randomUUID(),
      nome: corpo.nome.trim(),
      email: corpo.email,
      senha: corpo.senha,
      dataNascimento: corpo.dataNascimento,
    };
    db.usuarios.push(novo);
    db.sessaoUsuarioId = novo.id;
    return HttpResponse.json(semSenha(novo), { status: 201 });
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const corpo = (await request.json()) as LoginRequest;
    const usuario = db.usuarios.find((u) => u.email.toLowerCase() === corpo.email.toLowerCase() && u.senha === corpo.senha);
    if (!usuario) return problem(401, 'E-mail ou senha incorretos. Confira e tente de novo.');
    db.sessaoUsuarioId = usuario.id;
    return HttpResponse.json(semSenha(usuario));
  }),

  http.post(`${API}/auth/logout`, () => {
    db.sessaoUsuarioId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/me`, () => {
    const usuario = usuarioDaSessao();
    return usuario ? HttpResponse.json(semSenha(usuario)) : naoAutenticado();
  }),
];

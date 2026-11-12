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

  http.post(`${API}/me/exclusao`, async ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return problem(401, 'Usuário não autenticado.');
    const { senha } = (await request.json()) as { senha?: string };
    if (senha !== usuario.senha) return problem(403, 'Senha incorreta. A conta não foi excluída.');
    const lecionadas = db.turmas.filter((t) => t.professorId === usuario.id).length;
    if (lecionadas > 0) {
      return problem(409, `Você leciona ${lecionadas} ${lecionadas === 1 ? 'turma' : 'turmas'}. Exclua ${lecionadas === 1 ? 'a turma' : 'as turmas'} antes de excluir a conta.`);
    }

    const minhasEntregas = new Set(db.entregas.filter((e) => e.alunoId === usuario.id && !e.grupoId).map((e) => e.id));
    db.entregas = db.entregas.filter((e) => !minhasEntregas.has(e.id));
    db.avaliacoes = db.avaliacoes.filter((a) => !minhasEntregas.has(a.entregaId));
    db.comentariosAtividade = db.comentariosAtividade.filter((c) => c.autorId !== usuario.id);
    db.inscricoes = db.inscricoes.filter((i) => i.alunoId !== usuario.id);
    db.notificacoes = db.notificacoes.filter((n) => n.usuarioId !== usuario.id);
    db.grupos.forEach((g) => (g.integrantesIds = g.integrantesIds.filter((id) => id !== usuario.id)));
    db.grupos = db.grupos.filter((g) => g.integrantesIds.length > 0);
    db.usuarios = db.usuarios.filter((u) => u.id !== usuario.id);
    db.sessaoUsuarioId = null;
    return new HttpResponse(null, { status: 204 });
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

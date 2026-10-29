import { HttpResponse, http } from 'msw';
import { db, usuarioDaSessao } from '../db';
import { naoAutenticado } from './problem';
import { paraAtividadeApi } from './projecoes';
import { calcularGamificacao } from '@/features/gamificacao/calcular-gamificacao';

const API = '*/api/v1';

export const gamificacaoHandlers = [
  http.get(`${API}/gamificacao/perfil`, () => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const turmasAluno = db.inscricoes
      .filter((i) => i.alunoId === usuario.id)
      .map((i) => i.turmaId);

    const atividades = db.atividades
      .filter((a) => turmasAluno.includes(a.turmaId))
      .map((a) => paraAtividadeApi(a, usuario));

    const perfil = calcularGamificacao(atividades);
    return HttpResponse.json(perfil);
  }),
];

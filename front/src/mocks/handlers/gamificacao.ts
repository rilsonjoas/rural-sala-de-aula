import { HttpResponse, http } from 'msw';
import { db, usuarioDaSessao } from '../db';
import { naoAutenticado } from './problem';
import { paraAtividadeApi } from './projecoes';
import { calcularGamificacao } from '@/features/gamificacao/calcular-gamificacao';
import { calcularDocente } from '@/features/gamificacao/calcular-docente';
import type { PerfilGamificacao } from '@/features/gamificacao/tipos';

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

    const perfilBase = calcularGamificacao(atividades);

    const turmasProfessor = db.turmas.filter((t) => t.professorId === usuario.id);
    let docente = undefined;

    if (turmasProfessor.length > 0) {
      const turmasIds = turmasProfessor.map((t) => t.id);
      const atividadesDocente = db.atividades.filter((a) => turmasIds.includes(a.turmaId));
      const atividadesIds = atividadesDocente.map((a) => a.id);
      const entregasDocente = db.entregas.filter((e) => atividadesIds.includes(e.atividadeId));
      const entregasIds = entregasDocente.map((e) => e.id);
      const avaliacoesDocente = db.avaliacoes.filter((av) => entregasIds.includes(av.entregaId));
      const feedbacksComComentario = avaliacoesDocente.filter(
        (av) => av.comentarioPrivado && av.comentarioPrivado.trim().length > 0
      ).length;

      const avisosDocente = db.avisos.filter((av) => turmasIds.includes(av.turmaId));
      const respostasNoMural = avisosDocente.reduce((acc, av) => {
        const respostas = (av.comentarios ?? []).filter((c) => c.autorId === usuario.id).length;
        return acc + respostas;
      }, 0);

      const contagemPorTurma = turmasIds.map(
        (tid) => atividadesDocente.filter((a) => a.turmaId === tid).length
      );
      const maxAtividadesPorTurma = contagemPorTurma.length > 0 ? Math.max(...contagemPorTurma) : 0;
      const tiposDistintos = new Set(atividadesDocente.map((a) => a.tipo)).size;

      const teveAtividadeComTodasAvaliadas = atividadesDocente.some((a) => {
        const entregasDaAtiv = entregasDocente.filter((e) => e.atividadeId === a.id);
        if (entregasDaAtiv.length === 0) return false;
        return entregasDaAtiv.every((e) => avaliacoesDocente.some((av) => av.entregaId === e.id));
      });

      docente = calcularDocente({
        turmasLecionadas: turmasProfessor.length,
        atividadesPorTurma: maxAtividadesPorTurma,
        tiposDistintos,
        avaliacoesRealizadas: avaliacoesDocente.length,
        feedbacksComComentario,
        respostasNoMural,
        teveAtividadeComTodasAvaliadas,
      });
    }

    const perfil: PerfilGamificacao = {
      ...perfilBase,
      ...(docente ? { docente } : {}),
    };

    return HttpResponse.json(perfil);
  }),
];

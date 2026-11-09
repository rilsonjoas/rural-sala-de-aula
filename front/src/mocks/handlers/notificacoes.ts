import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, usuarioDaSessao } from '../db';
import type { NotificacaoDb } from '../domain';
import { naoAutenticado, naoEncontrado } from './problem';
import { agora, atividadesDisponiveis, entregaDoAluno, estaInscrito } from './projecoes';

const API = '*/api/v1';
const DIA_MS = 24 * 60 * 60 * 1000;
const LIMITE_DE_ITENS = 50;
const doisDigitos = (n: number) => String(n).padStart(2, '0');

type TipoGravado = NotificacaoDb['tipo'];

export function notificarNoMock(
  destinatarioId: string,
  tipo: TipoGravado,
  texto: string,
  turmaId: string,
  atividadeId: string | null,
  avisoId: string | null,
) {
  db.notificacoes.push({
    id: crypto.randomUUID(),
    usuarioId: destinatarioId,
    tipo,
    texto: texto.slice(0, 300),
    turmaId,
    atividadeId,
    avisoId,
    criadaEm: agora().toISOString(),
    lida: false,
  });
}

export function notificarAlunosNoMock(
  turmaId: string,
  autorId: string,
  tipo: TipoGravado,
  texto: string,
  atividadeId: string | null,
  avisoId: string | null,
) {
  db.inscricoes
    .filter((i) => i.turmaId === turmaId && i.alunoId !== autorId)
    .forEach((i) => notificarNoMock(i.alunoId, tipo, texto, turmaId, atividadeId, avisoId));
}

/** Resposta avisa o autor do comentário respondido; comentário de aluno sem pai avisa o professor; o do professor não avisa ninguém. */
export function notificarComentarioNoMock(opcoes: {
  autorId: string;
  autorNome: string;
  turmaId: string;
  atividadeId: string | null;
  avisoId: string | null;
  respondidoAutorId?: string;
  alvo: string;
}) {
  const turma = db.turmas.find((t) => t.id === opcoes.turmaId);
  if (!turma) return;
  if (opcoes.respondidoAutorId) {
    if (opcoes.respondidoAutorId !== opcoes.autorId) {
      notificarNoMock(
        opcoes.respondidoAutorId,
        'RESPOSTA_NOVA',
        `${opcoes.autorNome} respondeu ao seu comentário.`,
        turma.id,
        opcoes.atividadeId,
        opcoes.avisoId,
      );
    }
  } else if (turma.professorId !== opcoes.autorId) {
    notificarNoMock(
      turma.professorId,
      'COMENTARIO_NOVO',
      `${opcoes.autorNome} comentou ${opcoes.alvo}.`,
      turma.id,
      opcoes.atividadeId,
      opcoes.avisoId,
    );
  }
}

function turmasDoUsuario(usuarioId: string) {
  return db.turmas.filter((t) => t.professorId === usuarioId || estaInscrito(t.id, usuarioId));
}

function textoDoPrazo(nome: string, prazoIso: string, hoje: Date) {
  const prazo = new Date(prazoIso);
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diferenca = Math.round((dia(prazo) - dia(hoje)) / DIA_MS);
  const quando = diferenca === 0 ? 'hoje' : diferenca === 1 ? 'amanhã' : `em ${doisDigitos(prazo.getDate())}/${doisDigitos(prazo.getMonth() + 1)}`;
  return `O prazo de ${nome} termina ${quando} às ${doisDigitos(prazo.getHours())}:${doisDigitos(prazo.getMinutes())}.`;
}

export const notificacoesHandlers = [
  http.get(`${API}/notificacoes`, () => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const hoje = agora();

    // "atividade nova" é gerada na leitura, como na API
    const inicio = Math.max(new Date(db.inicioNotificacoes).getTime(), hoje.getTime() - 14 * DIA_MS);
    for (const turma of db.turmas.filter((t) => estaInscrito(t.id, usuario.id))) {
      for (const atividade of atividadesDisponiveis(turma.id)) {
        const abriu = new Date(atividade.disponivelEm).getTime();
        const jaTem = db.notificacoes.some((n) => n.usuarioId === usuario.id && n.atividadeId === atividade.id && n.tipo === 'ATIVIDADE_NOVA');
        if (abriu >= inicio && !jaTem) {
          db.notificacoes.push({
            id: crypto.randomUUID(),
            usuarioId: usuario.id,
            tipo: 'ATIVIDADE_NOVA',
            texto: `Nova atividade em ${turma.nome}: ${atividade.nome}.`.slice(0, 300),
            turmaId: turma.id,
            atividadeId: atividade.id,
            avisoId: null,
            criadaEm: atividade.disponivelEm,
            lida: false,
          });
        }
      }
    }

    const minhasTurmas = turmasDoUsuario(usuario.id);
    const ids = new Set(minhasTurmas.map((t) => t.id));
    const visiveis = db.notificacoes.filter((n) => n.usuarioId === usuario.id && ids.has(n.turmaId));
    const itens: components['schemas']['Notificacao'][] = [...visiveis]
      .sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime())
      .slice(0, LIMITE_DE_ITENS)
      .map((n) => ({
        id: n.id,
        tipo: n.tipo,
        texto: n.texto,
        turmaId: n.turmaId,
        atividadeId: n.atividadeId,
        avisoId: n.avisoId,
        criadaEm: n.criadaEm,
        lida: n.lida,
        paraProfessor: db.turmas.find((t) => t.id === n.turmaId)?.professorId === usuario.id,
      }));

    const limite = hoje.getTime() + 48 * 60 * 60 * 1000;
    const prazosProximos: components['schemas']['Notificacao'][] = db.turmas
      .filter((t) => estaInscrito(t.id, usuario.id))
      .flatMap((t) => atividadesDisponiveis(t.id))
      .filter((a) => {
        const prazo = new Date(a.prazoFinal).getTime();
        return prazo >= hoje.getTime() && prazo <= limite && !entregaDoAluno(a.id, usuario.id);
      })
      .sort((a, b) => new Date(a.prazoFinal).getTime() - new Date(b.prazoFinal).getTime())
      .map((a) => ({
        id: `prazo-${a.id}`,
        tipo: 'PRAZO_PROXIMO' as const,
        texto: textoDoPrazo(a.nome, a.prazoFinal, hoje),
        turmaId: a.turmaId,
        atividadeId: a.id,
        avisoId: null,
        criadaEm: a.prazoFinal,
        lida: true,
        paraProfessor: false,
      }));

    return HttpResponse.json({ naoLidas: visiveis.filter((n) => !n.lida).length, itens, prazosProximos });
  }),

  http.post(`${API}/notificacoes/lidas`, () => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    db.notificacoes.filter((n) => n.usuarioId === usuario.id).forEach((n) => (n.lida = true));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/notificacoes/:notificacaoId/lida`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const notificacao = db.notificacoes.find((n) => n.id === params.notificacaoId && n.usuarioId === usuario.id);
    if (!notificacao) return naoEncontrado('Notificação não encontrada.');
    notificacao.lida = true;
    return new HttpResponse(null, { status: 204 });
  }),
];

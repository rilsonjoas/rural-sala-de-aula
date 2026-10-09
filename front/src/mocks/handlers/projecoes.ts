import type { components } from '@/lib/api.generated';
import { db } from '../db';
import {
  estadoDaAtividade,
  type AtividadeDb,
  type EntregaDb,
  type TurmaDb,
} from '../domain';
import type { UsuarioComSenha } from '../fixtures';

type S = components['schemas'];

export const agora = () => new Date();

export function entregaDoAluno(atividadeId: string, alunoId: string) {
  return db.entregas.find((e) => e.atividadeId === atividadeId && e.alunoId === alunoId);
}

export function avaliacaoDaEntrega(entregaId: string) {
  return db.avaliacoes.find((a) => a.entregaId === entregaId);
}

export function estadoParaAluno(atividade: AtividadeDb, alunoId: string) {
  const entrega = entregaDoAluno(atividade.id, alunoId);
  return estadoDaAtividade(atividade, entrega, entrega ? avaliacaoDaEntrega(entrega.id) : undefined, agora());
}

export function estaInscrito(turmaId: string, alunoId: string) {
  return db.inscricoes.some((i) => i.turmaId === turmaId && i.alunoId === alunoId);
}

export function nomeDoUsuario(id: string) {
  return db.usuarios.find((u) => u.id === id)?.nome ?? '';
}

/** Atividades que o aluno já pode ver (disponíveis) em uma turma. */
export function atividadesDisponiveis(turmaId: string) {
  const t = agora().getTime();
  return db.atividades.filter((a) => a.turmaId === turmaId && new Date(a.disponivelEm).getTime() <= t);
}

export function paraTurmaApi(turma: TurmaDb, usuario: UsuarioComSenha): S['Turma'] {
  const base: S['Turma'] = {
    id: turma.id,
    professorId: turma.professorId,
    professorNome: nomeDoUsuario(turma.professorId),
    nome: turma.nome,
    disciplina: turma.disciplina,
    semestre: turma.semestre,
    diasAula: turma.diasAula,
  };

  if (usuario.papel === 'PROFESSOR') return { ...base, codigo: turma.codigo };

  const estados = atividadesDisponiveis(turma.id).map((a) => estadoParaAluno(a, usuario.id));
  return {
    ...base,
    atividadesPendentes: estados.filter((e) => e === 'PENDENTE').length,
    atividadesAtrasadas: estados.filter((e) => e === 'ATRASADA').length,
  };
}

export function paraAtividadeApi(atividade: AtividadeDb, usuario: UsuarioComSenha): S['Atividade'] {
  const turma = db.turmas.find((t) => t.id === atividade.turmaId)!;
  return {
    id: atividade.id,
    turmaId: atividade.turmaId,
    turmaNome: turma.nome,
    nome: atividade.nome,
    ...(atividade.descricao ? { descricao: atividade.descricao } : {}),
    complexidade: atividade.complexidade,
    tipo: atividade.tipo,
    modalidade: atividade.modalidade,
    prazoFinal: atividade.prazoFinal,
    disponivelEm: atividade.disponivelEm,
    ...(usuario.papel === 'ALUNO' ? { estado: estadoParaAluno(atividade, usuario.id) } : {}),
  };
}

export function paraEntregaApi(entrega: EntregaDb): S['Entrega'] {
  const atividade = db.atividades.find((a) => a.id === entrega.atividadeId)!;
  const avaliacao = avaliacaoDaEntrega(entrega.id);
  return {
    id: entrega.id,
    atividadeId: entrega.atividadeId,
    alunoId: entrega.alunoId,
    alunoNome: nomeDoUsuario(entrega.alunoId),
    nomeOriginal: entrega.nomeOriginal,
    tamanhoBytes: entrega.tamanhoBytes,
    enviadaEm: entrega.enviadaEm,
    atrasada: new Date(entrega.enviadaEm).getTime() > new Date(atividade.prazoFinal).getTime(),
    nota: avaliacao?.nota ?? null,
    comentarioPrivado: avaliacao?.comentarioPrivado ?? null,
  };
}

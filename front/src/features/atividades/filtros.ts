import type { components } from '@/lib/api.generated';

type S = components['schemas'];
export type Atividade = S['Atividade'];
export type EstadoAtividade = S['EstadoAtividade'];
export type AtividadeTipo = S['AtividadeTipo'];
export type AtividadeModalidade = S['AtividadeModalidade'];
export type Complexidade = S['Complexidade'];

export const ROTULO_ESTADO: Record<EstadoAtividade, string> = {
  PENDENTE: 'Pendente',
  ENTREGUE: 'Entregue',
  ENTREGUE_COM_ATRASO: 'Entregue com atraso',
  CONCLUIDA: 'Concluída',
  ATRASADA: 'Atrasada',
};

export const ROTULO_TIPO: Record<AtividadeTipo, string> = {
  PROVA: 'Prova',
  LISTA_DE_EXERCICIO: 'Lista de Exercício',
  PROJETO_INDIVIDUAL: 'Projeto Individual',
  PROJETO_EM_GRUPO: 'Projeto em Grupo',
};

export const ROTULO_MODALIDADE: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  GRUPO: 'Em grupo',
};

export const ROTULO_COMPLEXIDADE: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
};

export const ORDENACOES = {
  'prazo:asc': 'Prazo (mais próximo primeiro)',
  'prazo:desc': 'Prazo (mais distante primeiro)',
} as const;
export type Ordenacao = keyof typeof ORDENACOES;

/** Um chip ativo por grupo; grupos diferentes se combinam (E lógico). */
export type Filtros = {
  estado?: EstadoAtividade;
  tipo?: AtividadeTipo;
  modalidade?: AtividadeModalidade;
  complexidade?: Complexidade;
  turmaId?: string;
  ordenar: Ordenacao;
};

export const FILTROS_VAZIOS: Filtros = { ordenar: 'prazo:asc' };

export function temFiltroAtivo({ estado, tipo, turmaId }: Filtros): boolean {
  return Boolean(estado || tipo || turmaId);
}

export function limparFiltros(filtros: Filtros): Filtros {
  return { ordenar: filtros.ordenar };
}

/** Parâmetros de consulta da lista de uma turma (que não aceita o filtro por turma). */
export function paraConsultaDaTurma(filtros: Filtros) {
  const { turmaId, ...consulta } = paraConsulta(filtros);
  void turmaId;
  return consulta;
}

/** Converte os filtros da tela nos parâmetros de consulta da API. */
export function paraConsulta({ ordenar, ...filtros }: Filtros) {
  const [campo, direcao] = ordenar.split(':') as ['prazo', 'asc' | 'desc'];
  return { ...filtros, ordenar: campo, direcao };
}

const ESTADOS = Object.keys(ROTULO_ESTADO);
const TIPOS = Object.keys(ROTULO_TIPO);

/** Lê os filtros guardados no navegador, descartando o que for inválido (texto quebrado, valor desconhecido). */
export function lerFiltrosSalvos(texto: string | null): Filtros {
  let bruto: Record<string, unknown>;
  try {
    const lido: unknown = texto ? JSON.parse(texto) : null;
    bruto = typeof lido === 'object' && lido !== null ? (lido as Record<string, unknown>) : {};
  } catch {
    bruto = {};
  }

  const filtros: Filtros = { ordenar: (bruto.ordenar as Ordenacao) in ORDENACOES ? (bruto.ordenar as Ordenacao) : 'prazo:asc' };
  if (ESTADOS.includes(bruto.estado as string)) filtros.estado = bruto.estado as EstadoAtividade;
  if (TIPOS.includes(bruto.tipo as string)) filtros.tipo = bruto.tipo as AtividadeTipo;
  if (typeof bruto.turmaId === 'string' && bruto.turmaId) filtros.turmaId = bruto.turmaId;
  return filtros;
}

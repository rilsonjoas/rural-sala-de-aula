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
export const ROTULO_TIPO: Record<AtividadeTipo, string> = { ATIVIDADE: 'Atividade', TRABALHO: 'Trabalho', PROVA: 'Prova' };
export const ROTULO_MODALIDADE: Record<AtividadeModalidade, string> = { INDIVIDUAL: 'Individual', GRUPO: 'Em grupo' };
export const ROTULO_COMPLEXIDADE: Record<Complexidade, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' };

export const ORDENACOES = {
  'prazo:asc': 'Prazo (mais próximo primeiro)',
  'prazo:desc': 'Prazo (mais distante primeiro)',
  'complexidade:desc': 'Complexidade (maior primeiro)',
  'complexidade:asc': 'Complexidade (menor primeiro)',
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

export function temFiltroAtivo({ estado, tipo, modalidade, complexidade, turmaId }: Filtros): boolean {
  return Boolean(estado || tipo || modalidade || complexidade || turmaId);
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
  const [campo, direcao] = ordenar.split(':') as ['prazo' | 'complexidade', 'asc' | 'desc'];
  return { ...filtros, ordenar: campo, direcao };
}

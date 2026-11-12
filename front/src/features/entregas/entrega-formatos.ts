import { formatDataHora } from '@/lib/format';
import type { Entrega } from './api';

export const enviadaEm = (entrega: Entrega) => `Enviada em ${formatDataHora(entrega.enviadaEm)}`;

/** Quem aparece como autor: o grupo (projeto em grupo) ou o aluno. */
export const autorDaEntrega = (entrega: Entrega) => (entrega.grupoNome ? `Grupo ${entrega.grupoNome}` : entrega.alunoNome);

/** Linha de apoio da entrega em grupo: integrantes e quem enviou o arquivo; nulo na entrega individual. */
export function detalheDoGrupo(entrega: Entrega): string | null {
  if (!entrega.grupoNome) return null;
  const nomes = (entrega.integrantes ?? []).map((i) => i.nome).join(', ');
  return `${nomes ? `${nomes} · ` : ''}enviada por ${entrega.alunoNome}`;
}

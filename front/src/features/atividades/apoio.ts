import { formatPrazoRelativo } from '@/lib/format';
import type { Atividade } from './filtros';

export function apoioAoEstado(atividade: Atividade): string | null {
  switch (atividade.estado) {
    case 'PENDENTE':
    case 'ATRASADA':
      return formatPrazoRelativo(atividade.prazoFinal);
    case 'ENTREGUE':
      return 'Aguardando avaliação';
    case 'ENTREGUE_COM_ATRASO':
      return 'Enviada depois do prazo final';
    case 'CONCLUIDA':
      return 'Nota e comentário disponíveis';
    default:
      return null;
  }
}

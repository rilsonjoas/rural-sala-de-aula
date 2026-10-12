import { AlertTriangle, Award, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';
import type { components } from '@/lib/api.generated';
import { formatNota } from '@/lib/format';
import { cn } from '@/lib/utils';

export type EstadoAtividade = components['schemas']['EstadoAtividade'];

type Config = { rotulo: string; Icone: LucideIcon; classes: string };

const CONFIG: Record<EstadoAtividade, Config> = {
  PENDENTE: { rotulo: 'Pendente', Icone: Clock, classes: 'border border-primary bg-card text-primary' },
  ENTREGUE: { rotulo: 'Entregue', Icone: CheckCircle2, classes: 'bg-secondary text-primary' },
  ENTREGUE_COM_ATRASO: {
    rotulo: 'Entregue com atraso',
    Icone: AlertTriangle,
    classes: 'bg-danger-tint text-destructive',
  },
  CONCLUIDA: { rotulo: 'Concluída', Icone: Award, classes: 'bg-success-tint text-success' },
  ATRASADA: { rotulo: 'Atrasada', Icone: AlertTriangle, classes: 'bg-destructive text-destructive-foreground' },
};

/** Selo do estado da atividade. Sempre ícone + texto: o estado nunca depende só da cor. */
export function StatusBadge({ estado, nota }: { estado: EstadoAtividade; nota?: number | null }) {
  const { rotulo, Icone, classes } = CONFIG[estado];
  const texto = estado === 'CONCLUIDA' && nota != null ? `${rotulo} · nota ${formatNota(nota)}` : rotulo;

  return (
    <span className={cn('inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold', classes)}>
      <Icone aria-hidden="true" className="size-3.5 shrink-0" />
      {texto}
    </span>
  );
}

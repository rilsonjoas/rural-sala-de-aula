import { CheckCircle2, Clock, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Grupo } from './api';

const CONFIG: Record<Grupo['status'], { rotulo: string; Icone: LucideIcon; classes: string }> = {
  PENDENTE: { rotulo: 'Aguardando aprovação', Icone: Clock, classes: 'border border-primary bg-card text-primary' },
  APROVADO: { rotulo: 'Aprovado', Icone: CheckCircle2, classes: 'bg-success-tint text-success' },
  REPROVADO: { rotulo: 'Não aprovado', Icone: XCircle, classes: 'bg-secondary text-muted-foreground' },
};

/** Ícone + texto: o estado do grupo nunca depende só da cor. */
export function SeloDoGrupo({ status }: { status: Grupo['status'] }) {
  const { rotulo, Icone, classes } = CONFIG[status];
  return (
    <span className={cn('inline-flex min-h-5 sm:min-h-6 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold', classes)}>
      <Icone aria-hidden="true" className="size-3.5 shrink-0" />
      {rotulo}
    </span>
  );
}

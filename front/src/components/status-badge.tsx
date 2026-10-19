import { AlarmClock, AlertTriangle, Award, CalendarX2, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';
import type { components } from '@/lib/api.generated';
import { formatNota } from '@/lib/format';
import type { Urgencia } from '@/lib/urgencia';
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

const VENCE_EM_BREVE: Config = {
  rotulo: 'Vence em breve',
  Icone: AlarmClock,
  classes: 'bg-highlight text-highlight-foreground',
};

const PRAZO_ENCERRADO: Config = {
  rotulo: 'Prazo encerrado',
  Icone: CalendarX2,
  classes: 'bg-secondary text-muted-foreground',
};

const SELO = 'inline-flex min-h-5 sm:min-h-6 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold';

/**
 * Selo do estado da atividade. Sempre ícone + texto: o estado nunca depende só da cor.
 * `urgente` (aluno, PENDENTE com 48 h ou menos) troca "Pendente" por "Vence em breve", em âmbar.
 */
export function StatusBadge({
  estado,
  nota,
  urgente = false,
}: {
  estado: EstadoAtividade;
  nota?: number | null;
  urgente?: boolean;
}) {
  const { rotulo, Icone, classes } = urgente && estado === 'PENDENTE' ? VENCE_EM_BREVE : CONFIG[estado];
  const texto = estado === 'CONCLUIDA' && nota != null ? `${rotulo} · nota ${formatNota(nota)}` : rotulo;

  return (
    <span className={cn(SELO, classes)}>
      <Icone aria-hidden="true" className="size-3.5 shrink-0" />
      {texto}
    </span>
  );
}

/** Professor: o prazo da atividade que ele criou. Âmbar quando vence em 48 h; cinza quando já encerrou. */
export function PrazoBadge({ urgencia }: { urgencia: Urgencia | null }) {
  if (!urgencia) return null;
  const { rotulo, Icone, classes } = urgencia === 'BREVE' ? VENCE_EM_BREVE : PRAZO_ENCERRADO;
  return (
    <span className={cn(SELO, classes)}>
      <Icone aria-hidden="true" className="size-3.5 shrink-0" />
      {rotulo}
    </span>
  );
}

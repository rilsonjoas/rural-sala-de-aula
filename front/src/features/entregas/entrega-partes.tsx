import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatNota } from '@/lib/format';
import { cn } from '@/lib/utils';
import { baixarEntrega, type Entrega } from './api';

export function SituacaoBadge({ atrasada }: { atrasada: boolean }) {
  const Icone = atrasada ? AlertTriangle : CheckCircle2;
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold',
        atrasada ? 'bg-danger-tint text-destructive' : 'bg-secondary text-primary',
      )}
    >
      <Icone aria-hidden="true" className="size-3.5" />
      {atrasada ? 'Com atraso' : 'No prazo'}
    </span>
  );
}

export function NotaChip({ nota }: { nota: number | null | undefined }) {
  return nota != null ? (
    <span className="inline-flex min-h-6 items-center whitespace-nowrap rounded-md bg-success-tint px-2 text-xs font-semibold text-success">{`Nota ${formatNota(nota)}`}</span>
  ) : (
    <span className="inline-flex min-h-6 items-center whitespace-nowrap rounded-md bg-secondary px-2 text-xs font-semibold text-muted-foreground">Sem nota</span>
  );
}

export function AcoesDaEntrega({ entrega, onAvaliar }: { entrega: Entrega; onAvaliar: (entrega: Entrega) => void }) {
  async function baixar() {
    try {
      await baixarEntrega(entrega);
    } catch {
      toast.error('Não foi possível baixar o arquivo. Tente de novo.');
    }
  }
  const avaliada = entrega.nota != null;

  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" aria-label={`Baixar arquivo de ${entrega.alunoNome}`} onClick={() => void baixar()}>
        <Download aria-hidden="true" className="size-4" />
        Baixar
      </Button>
      <Button
        type="button"
        variant={avaliada ? 'outline' : 'default'}
        aria-label={`${avaliada ? 'Editar nota' : 'Avaliar entrega'} de ${entrega.alunoNome}`}
        onClick={() => onAvaliar(entrega)}
      >
        {avaliada ? 'Editar nota' : 'Avaliar'}
      </Button>
    </div>
  );
}

import { useId } from 'react';
import { FileText } from 'lucide-react';
import { formatTamanho, iniciais } from '@/lib/format';
import { enviadaEm } from './entrega-formatos';
import { AcoesDaEntrega, NotaChip, SituacaoBadge } from './entrega-partes';
import type { Entrega } from './api';

type Props = { entregas: Entrega[]; onAvaliar: (entrega: Entrega) => void };

function Item({ entrega, onAvaliar }: { entrega: Entrega; onAvaliar: Props['onAvaliar'] }) {
  const idTitulo = useId();
  return (
    <article aria-labelledby={idTitulo} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
          {iniciais(entrega.alunoNome)}
        </span>
        <h3 id={idTitulo} className="min-w-0 flex-1 text-lg font-semibold text-primary">
          {entrega.alunoNome}
        </h3>
        <SituacaoBadge atrasada={entrega.atrasada} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-primary">
            <FileText aria-hidden="true" className="size-4 shrink-0" />
            <span className="break-all">{entrega.nomeOriginal}</span>
          </p>
          <p className="text-sm text-muted-foreground">{`${formatTamanho(entrega.tamanhoBytes)} · ${enviadaEm(entrega)}`}</p>
        </div>
        <NotaChip nota={entrega.nota} />
      </div>
      <AcoesDaEntrega entrega={entrega} onAvaliar={onAvaliar} />
    </article>
  );
}

export function EntregasLista({ entregas, onAvaliar }: Props) {
  return (
    <div className="space-y-3">
      {entregas.map((e) => (
        <Item key={e.id} entrega={e} onAvaliar={onAvaliar} />
      ))}
    </div>
  );
}

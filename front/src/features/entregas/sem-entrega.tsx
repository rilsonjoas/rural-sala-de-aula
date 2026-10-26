import { UserX } from 'lucide-react';
import { plural } from '@/lib/format';
import { useSemEntrega } from './api';

/** Quem está inscrito e ainda não entregou: a tela de entregas só mostrava quem entregou. */
export function SemEntrega({ atividadeId }: { atividadeId: string }) {
  const semEntrega = useSemEntrega(atividadeId);
  const lista = semEntrega.data ?? [];
  if (!semEntrega.isSuccess || lista.length === 0) return null;

  return (
    <section aria-labelledby="titulo-sem-entrega" className="space-y-2 rounded-xl border border-border bg-card p-4">
      <h3 id="titulo-sem-entrega" className="flex items-center gap-2 text-base font-semibold text-primary">
        <UserX aria-hidden="true" className="size-4" />
        {`Ainda não entregaram (${lista.length})`}
      </h3>
      <p className="text-xs text-muted-foreground">{`${plural(lista.length, 'aluno')} inscrito${lista.length === 1 ? '' : 's'} sem entrega nesta atividade.`}</p>
      <ul className="divide-y divide-border text-sm">
        {lista.map((aluno) => (
          <li key={aluno.id} className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
            <span className="font-medium text-foreground">{aluno.nome}</span>
            <span className="text-xs text-muted-foreground">{aluno.email}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

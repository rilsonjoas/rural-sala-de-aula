import { formatTamanho } from '@/lib/format';
import { enviadaEm } from './entrega-formatos';
import { AcoesDaEntrega, NotaChip, SituacaoBadge } from './entrega-partes';
import type { Entrega } from './api';

type Props = { entregas: Entrega[]; onAvaliar: (entrega: Entrega) => void };

export function EntregasTabela({ entregas, onAvaliar }: Props) {
  const th = 'px-3 py-2 text-left font-semibold text-primary';
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/50">
          <tr>
            <th scope="col" className={th}>Aluno</th>
            <th scope="col" className={th}>Arquivo</th>
            <th scope="col" className={th}>Enviada em</th>
            <th scope="col" className={th}>Situação</th>
            <th scope="col" className={th}>Nota</th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0">
              <td className="px-3 py-3 font-semibold text-primary">{e.alunoNome}</td>
              <td className="px-3 py-3">
                <span className="break-all">{e.nomeOriginal}</span>
                <span className="block text-muted-foreground">{formatTamanho(e.tamanhoBytes)}</span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{enviadaEm(e).replace('Enviada em ', '')}</td>
              <td className="px-3 py-3">
                <SituacaoBadge atrasada={e.atrasada} />
              </td>
              <td className="px-3 py-3">
                <NotaChip nota={e.nota} />
              </td>
              <td className="px-3 py-3">
                <AcoesDaEntrega entrega={e} onAvaliar={onAvaliar} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

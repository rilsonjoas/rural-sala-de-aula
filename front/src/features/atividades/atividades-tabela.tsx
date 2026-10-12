import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ComplexidadeIndicator } from '@/components/complexidade-indicator';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatDataHora } from '@/lib/format';
import { alunoComPressa } from '@/lib/urgencia';
import { ROTULO_TIPO, type Atividade, type Ordenacao } from './filtros';

type Props = { atividades: Atividade[]; ordenar: Ordenacao; onOrdenar: (ordenar: Ordenacao) => void };

const ACAO: Record<NonNullable<Atividade['estado']>, string> = {
  PENDENTE: 'Enviar entrega',
  ATRASADA: 'Enviar entrega',
  ENTREGUE: 'Ver detalhes',
  ENTREGUE_COM_ATRASO: 'Ver envio',
  CONCLUIDA: 'Ver nota e comentário',
};

function CabecalhoOrdenavel({
  rotulo,
  campo,
  ordenar,
  onOrdenar,
  primeiraDirecao,
}: {
  rotulo: string;
  campo: 'prazo' | 'complexidade';
  ordenar: Ordenacao;
  onOrdenar: (ordenar: Ordenacao) => void;
  primeiraDirecao: 'asc' | 'desc';
}) {
  const [campoAtual, direcaoAtual] = ordenar.split(':') as [string, 'asc' | 'desc'];
  const ativo = campoAtual === campo;
  const proxima = ativo ? (direcaoAtual === 'asc' ? 'desc' : 'asc') : primeiraDirecao;
  const Icone = !ativo ? ArrowUpDown : direcaoAtual === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th scope="col" aria-sort={!ativo ? 'none' : direcaoAtual === 'asc' ? 'ascending' : 'descending'} className="px-3 py-2 text-left">
      <button
        type="button"
        onClick={() => onOrdenar(`${campo}:${proxima}` as Ordenacao)}
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {rotulo}
        <Icone aria-hidden="true" className="size-4" />
      </button>
    </th>
  );
}

export function AtividadesTabela({ atividades, ordenar, onOrdenar }: Props) {
  const simples = 'px-3 py-2 text-left font-semibold text-primary';
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/50">
          <tr>
            <th scope="col" className={simples}>
              Atividade
            </th>
            <th scope="col" className={simples}>
              Turma
            </th>
            <th scope="col" className={simples}>
              Tipo
            </th>
            <CabecalhoOrdenavel rotulo="Complexidade" campo="complexidade" ordenar={ordenar} onOrdenar={onOrdenar} primeiraDirecao="desc" />
            <CabecalhoOrdenavel rotulo="Prazo final" campo="prazo" ordenar={ordenar} onOrdenar={onOrdenar} primeiraDirecao="asc" />
            <th scope="col" className={simples}>
              Estado
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Ação</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0">
              <td className="px-3 py-3 font-semibold text-primary">
                <Link to={`/atividades/${a.id}`} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {a.nome}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{a.turmaNome}</td>
              <td className="px-3 py-3">{ROTULO_TIPO[a.tipo]}</td>
              <td className="px-3 py-3">
                <ComplexidadeIndicator nivel={a.complexidade} />
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{formatDataHora(a.prazoFinal)}</td>
              <td className="px-3 py-3">{a.estado ? <StatusBadge estado={a.estado} nota={a.nota} urgente={alunoComPressa(a)} /> : null}</td>
              <td className="px-3 py-3 text-right">
                {a.estado ? (
                  <Button asChild size="sm" variant={a.estado === 'PENDENTE' || a.estado === 'ATRASADA' ? 'default' : 'secondary'}>
                    <Link to={`/atividades/${a.id}`}>{ACAO[a.estado]}</Link>
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

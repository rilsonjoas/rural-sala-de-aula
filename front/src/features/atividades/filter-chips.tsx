import { Check } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { limparFiltros, ORDENACOES, temFiltroAtivo, type Filtros, type Ordenacao } from './filtros';

export type GrupoDeChips = {
  chave: 'estado' | 'tipo' | 'modalidade' | 'complexidade' | 'turmaId';
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
};

type Props = { grupos: GrupoDeChips[]; filtros: Filtros; onChange: (filtros: Filtros) => void };

export function FilterChips({ grupos, filtros, onChange }: Props) {
  const idOrdenar = useId();
  return (
    <div className="space-y-3">
      <div className="flex gap-4 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,black_90%,transparent)] lg:flex-wrap lg:overflow-visible lg:[mask-image:none]">
        {grupos.map((grupo) => (
          <div key={grupo.chave} role="group" aria-label={grupo.rotulo} className="flex shrink-0 items-center gap-2 lg:flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{grupo.rotulo}</span>
            {grupo.opcoes.map((opcao) => {
              const ativo = filtros[grupo.chave] === opcao.valor;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onChange({ ...filtros, [grupo.chave]: ativo ? undefined : opcao.valor })}
                  className={cn(
                    'inline-flex min-h-9 sm:min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    ativo ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary hover:bg-accent',
                  )}
                >
                  {ativo ? <Check aria-hidden="true" className="size-3.5 sm:size-4" /> : null}
                  {opcao.rotulo}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 sm:space-y-1.5">
          <span id={idOrdenar} className="text-xs sm:text-sm font-semibold text-primary">
            Ordenar por
          </span>
          <Select value={filtros.ordenar} onValueChange={(valor) => onChange({ ...filtros, ordenar: valor as Ordenacao })}>
            <SelectTrigger aria-labelledby={idOrdenar} className="w-full sm:w-80 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(ORDENACOES) as [Ordenacao, string][]).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {temFiltroAtivo(filtros) ? (
          <Button type="button" variant="ghost" onClick={() => onChange(limparFiltros(filtros))}>
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}

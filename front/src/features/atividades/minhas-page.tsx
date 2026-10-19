import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/session/use-session';
import { useTurmas } from '@/features/turmas/api';
import { plural } from '@/lib/format';
import { useMediaQuery } from '@/lib/use-media-query';
import { usePageTitle } from '@/lib/use-page-title';
import { useMinhasAtividades } from './api';
import { AtividadeCard } from './atividade-card';
import { AtividadesTabela } from './atividades-tabela';
import { FilterChips, type GrupoDeChips } from './filter-chips';
import {
  limparFiltros,
  ROTULO_COMPLEXIDADE,
  ROTULO_ESTADO,
  ROTULO_MODALIDADE,
  ROTULO_TIPO,
  temFiltroAtivo,
} from './filtros';
import { useFiltrosSalvos } from './use-filtros-salvos';

const opcoes = (rotulos: Record<string, string>) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="animate-pulse space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-36 rounded-xl border border-border bg-secondary" />
      ))}
    </div>
  );
}

export function MinhasAtividadesPage() {
  const { usuario } = useSession();
  usePageTitle('Minhas atividades');
  const [filtros, setFiltros] = useFiltrosSalvos(`filtros:${usuario?.id ?? 'anonimo'}`);
  const atividades = useMinhasAtividades(filtros);
  const turmas = useTurmas();
  const desktop = useMediaQuery('(min-width: 1024px)');

  const grupos: GrupoDeChips[] = [
    { chave: 'estado', rotulo: 'Estado', opcoes: opcoes(ROTULO_ESTADO) },
    { chave: 'tipo', rotulo: 'Tipo', opcoes: opcoes(ROTULO_TIPO) },
    { chave: 'turmaId', rotulo: 'Turma', opcoes: (turmas.data ?? []).map((t) => ({ valor: t.id, rotulo: t.nome })) },
  ];
  const lista = atividades.data ?? [];

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-4 sm:space-y-5">
      <div className="space-y-0.5 sm:space-y-1">
        <h2 id="titulo-pagina" className="text-xl sm:text-2xl font-bold text-primary">
          Minhas atividades
        </h2>
        {atividades.isSuccess ? (
          <p className="text-xs sm:text-sm text-muted-foreground">{`Todas as turmas · ${plural(lista.length, 'atividade')}`}</p>
        ) : null}
      </div>

      <FilterChips grupos={grupos} filtros={filtros} onChange={setFiltros} />

      {atividades.isPending ? <Esqueleto /> : null}
      {atividades.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar suas atividades. Verifique a conexão e tente de novo."
          onRetry={() => void atividades.refetch()}
        />
      ) : null}

      {atividades.isSuccess && lista.length === 0 ? (
        temFiltroAtivo(filtros) ? (
          <EmptyState
            mensagem="Nenhuma atividade com esses filtros."
            acao={
              <Button type="button" variant="outline" onClick={() => setFiltros(limparFiltros(filtros))}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState mensagem="Nenhuma atividade por aqui ainda." />
        )
      ) : null}

      {atividades.isSuccess && lista.length > 0 ? (
        desktop ? (
          <AtividadesTabela atividades={lista} ordenar={filtros.ordenar} onOrdenar={(ordenar) => setFiltros({ ...filtros, ordenar })} />
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {lista.map((a) => (
              <AtividadeCard key={a.id} atividade={a} variante="minhas" />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}

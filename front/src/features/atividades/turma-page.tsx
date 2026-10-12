import { ArrowLeft, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/session/use-session';
import { CopiarCodigo } from '@/features/turmas/copiar-codigo';
import { useTurma } from '@/features/turmas/api';
import { ApiError } from '@/lib/api-error';
import { formatDias } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';
import { useAtividadesDaTurma } from './api';
import { AtividadeCard } from './atividade-card';
import { FilterChips, type GrupoDeChips } from './filter-chips';
import {
  FILTROS_VAZIOS,
  limparFiltros,
  ROTULO_COMPLEXIDADE,
  ROTULO_ESTADO,
  ROTULO_MODALIDADE,
  ROTULO_TIPO,
  temFiltroAtivo,
  type Filtros,
} from './filtros';
import { NovaAtividadeSheet } from './nova-atividade-sheet';

const opcoes = (rotulos: Record<string, string>) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

function gruposDaTurma(professor: boolean): GrupoDeChips[] {
  return [
    ...(professor ? [] : [{ chave: 'estado' as const, rotulo: 'Estado', opcoes: opcoes(ROTULO_ESTADO) }]),
    { chave: 'tipo', rotulo: 'Tipo', opcoes: opcoes(ROTULO_TIPO) },
    { chave: 'modalidade', rotulo: 'Modalidade', opcoes: opcoes(ROTULO_MODALIDADE) },
    { chave: 'complexidade', rotulo: 'Complexidade', opcoes: opcoes(ROTULO_COMPLEXIDADE) },
  ];
}

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="animate-pulse space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-32 rounded-xl border border-border bg-secondary" />
      ))}
    </div>
  );
}

export function TurmaPage() {
  const { turmaId = '' } = useParams();
  const { usuario } = useSession();
  const professor = usuario?.papel === 'PROFESSOR';
  const turma = useTurma(turmaId);
  usePageTitle(turma.data?.nome ?? 'Turma');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [folhaAberta, setFolhaAberta] = useState(false);
  const atividades = useAtividadesDaTurma(turmaId, filtros);

  if (turma.isError && turma.error instanceof ApiError && turma.error.status === 404) {
    return (
      <EmptyState
        mensagem="Turma não encontrada."
        acao={
          <Button asChild>
            <Link to="/turmas">Voltar para Turmas</Link>
          </Button>
        }
      />
    );
  }
  if (turma.isError) {
    return <ErrorState mensagem="Não conseguimos carregar a turma. Verifique a conexão e tente de novo." onRetry={() => void turma.refetch()} />;
  }

  const lista = atividades.data ?? [];
  const botaoNova = professor ? (
    <Button type="button" className="w-full sm:w-auto" onClick={() => setFolhaAberta(true)}>
      Cadastrar atividade
    </Button>
  ) : null;

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-5">
      <Link to="/turmas" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Turmas
      </Link>

      {turma.data ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 id="titulo-pagina" className="text-2xl font-bold text-primary">
            {turma.data.nome}
          </h2>
          <p className="text-muted-foreground">{`${turma.data.disciplina} · ${turma.data.semestre}`}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {professor ? null : (
              <span className="inline-flex items-center gap-2">
                <Users aria-hidden="true" className="size-4" />
                Prof. {turma.data.professorNome}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden="true" className="size-4" />
              {formatDias(turma.data.diasAula)}
            </span>
          </div>
          {professor && turma.data.codigo ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3">
              <div>
                <p className="text-sm text-muted-foreground">Código de inscrição</p>
                <p className="font-mono text-lg font-bold tracking-wider text-primary">{turma.data.codigo}</p>
              </div>
              <CopiarCodigo codigo={turma.data.codigo} />
            </div>
          ) : null}
        </div>
      ) : (
        <h2 id="titulo-pagina" className="sr-only">
          Turma
        </h2>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-primary">
          Atividades
          {atividades.isSuccess ? (
            <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-sm">{lista.length}</span>
          ) : null}
        </h3>
        {atividades.isSuccess && lista.length === 0 && !temFiltroAtivo(filtros) ? null : botaoNova}
      </div>

      <FilterChips grupos={gruposDaTurma(professor)} filtros={filtros} onChange={setFiltros} />

      {atividades.isPending ? <Esqueleto /> : null}
      {atividades.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar as atividades. Verifique a conexão e tente de novo."
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
          <EmptyState mensagem="Nenhuma atividade por aqui ainda." acao={botaoNova} />
        )
      ) : null}
      {atividades.isSuccess && lista.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((atividade) => (
            <AtividadeCard
              key={atividade.id}
              atividade={atividade}
              variante={professor ? 'turma-professor' : 'turma-aluno'}
              nivelTitulo={4}
            />
          ))}
        </div>
      ) : null}

      {professor && turma.data ? (
        <NovaAtividadeSheet turmaId={turmaId} turmaNome={turma.data.nome} open={folhaAberta} onOpenChange={setFolhaAberta} />
      ) : null}
    </section>
  );
}

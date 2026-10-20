import { ArrowLeft, ClipboardList, Clock, Megaphone, Users } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { MuralAba } from '@/features/avisos/mural-aba';
import { useAtividadesDaTurma } from './api';
import { AtividadeCard } from './atividade-card';
import { FilterChips, type GrupoDeChips } from './filter-chips';
import {
  FILTROS_VAZIOS,
  limparFiltros,
  ROTULO_ESTADO,
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
  const turma = useTurma(turmaId);
  const professor = Boolean(turma.data && usuario && turma.data.professorId === usuario.id);
  usePageTitle(turma.data?.nome ?? 'Turma');
  const [abaAtiva, setAbaAtiva] = useState<'mural' | 'atividades'>('mural');
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={cn(
                  'mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                  professor ? 'bg-primary/10 text-primary' : 'bg-emerald-500/15 text-emerald-700',
                )}
              >
                {professor ? 'Você leciona esta turma' : 'Você está inscrito nesta turma'}
              </span>
              <h2 id="titulo-pagina" className="text-xl sm:text-2xl font-bold text-primary leading-snug">
                {turma.data.nome}
              </h2>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-primary">
              {turma.data.semestre}
            </span>
          </div>
          {turma.data.disciplina && turma.data.disciplina !== turma.data.nome ? (
            <p className="text-xs sm:text-sm text-muted-foreground">{turma.data.disciplina}</p>
          ) : null}
          {turma.data.descricao ? <p className="text-xs sm:text-sm text-foreground/80">{turma.data.descricao}</p> : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
            {professor ? null : (
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden="true" className="size-3.5 sm:size-4" />
                Prof. {turma.data.professorNome}
              </span>
            )}
            {turma.data.diasAula && turma.data.diasAula.length > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5 sm:size-4" />
                {formatDias(turma.data.diasAula)}
              </span>
            ) : null}
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

      {/* Navegação entre abas: Mural e Atividades */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setAbaAtiva('mural')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2',
            abaAtiva === 'mural'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Megaphone className="size-4" aria-hidden="true" />
          <span>Mural</span>
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('atividades')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2',
            abaAtiva === 'atividades'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          <span>Atividades</span>
          {atividades.isSuccess && lista.length > 0 ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{lista.length}</span>
          ) : null}
        </button>
      </div>

      {abaAtiva === 'mural' ? (
        <MuralAba turmaId={turmaId} podePublicar={professor} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-primary">
              Atividades da turma
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
        </div>
      )}
    </section>
  );
}

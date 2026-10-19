import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/session/use-session';
import { plural } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';
import { useTurmas, type Turma } from './api';
import { EntrarEmTurmaSheet } from './entrar-em-turma-sheet';
import { NovaTurmaSheet } from './nova-turma-sheet';
import { SemestreSelect, TODOS_OS_SEMESTRES } from './semestre-select';
import { TurmaCardAluno, TurmaCardProfessor } from './turma-cards';

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="grid animate-pulse gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
      {[1, 2].map((n) => (
        <div key={n} className="h-48 rounded-xl border border-border bg-secondary" />
      ))}
    </div>
  );
}

export function TurmasPage() {
  const { usuario } = useSession();
  usePageTitle('Minhas turmas');
  const turmas = useTurmas();
  const [escolhido, setEscolhido] = useState<string>();
  const [sheetAberta, setSheetAberta] = useState<'criar' | 'entrar' | null>(null);

  const todas = turmas.data ?? [];
  const semestres = [...new Set(todas.map((t) => t.semestre))].sort().reverse();
  const semestre = escolhido ?? semestres[0] ?? TODOS_OS_SEMESTRES;
  const visiveis = semestre === TODOS_OS_SEMESTRES ? todas : todas.filter((t) => t.semestre === semestre);

  const acoes = (
    <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSheetAberta('entrar')}>
        Entrar em turma
      </Button>
      <Button type="button" className="w-full sm:w-auto" onClick={() => setSheetAberta('criar')}>
        Cadastrar turma
      </Button>
    </div>
  );

  const contador = plural(visiveis.length, 'turma');

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="titulo-pagina" className="text-xl sm:text-2xl font-bold text-primary">
          Minhas turmas
        </h2>
        {turmas.isSuccess && todas.length === 0 ? null : acoes}
      </div>

      {turmas.isPending ? <Esqueleto /> : null}

      {turmas.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo."
          onRetry={() => void turmas.refetch()}
        />
      ) : null}

      {turmas.isSuccess && todas.length === 0 ? (
        <EmptyState
          mensagem="Você ainda não está em nenhuma turma. Cadastre uma turma para lecionar ou entre com o código fornecido pelo professor."
          acao={acoes}
        />
      ) : null}

      {turmas.isSuccess && todas.length > 0 ? (
        <>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <SemestreSelect semestres={semestres} valor={semestre} onChange={setEscolhido} />
            <span className="inline-flex min-h-7 sm:min-h-8 w-fit items-center rounded-full bg-secondary px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-primary">
              {contador}
            </span>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
            {visiveis.map((turma: Turma) => {
              const isProfessor = turma.professorId === usuario?.id;
              return isProfessor ? (
                <TurmaCardProfessor key={turma.id} turma={turma} />
              ) : (
                <TurmaCardAluno key={turma.id} turma={turma} />
              );
            })}
          </div>
        </>
      ) : null}

      <NovaTurmaSheet
        open={sheetAberta === 'criar'}
        onOpenChange={(aberto) => !aberto && setSheetAberta(null)}
        aoCriar={(t) => setEscolhido(t.semestre)}
      />
      <EntrarEmTurmaSheet
        open={sheetAberta === 'entrar'}
        onOpenChange={(aberto) => !aberto && setSheetAberta(null)}
        aoEntrar={(t) => setEscolhido(t.semestre)}
      />
    </section>
  );
}

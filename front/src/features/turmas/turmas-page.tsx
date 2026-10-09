import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/session/use-session';
import { plural } from '@/lib/format';
import { useTurmas, type Turma } from './api';
import { EntrarEmTurmaSheet } from './entrar-em-turma-sheet';
import { NovaTurmaSheet } from './nova-turma-sheet';
import { SemestreSelect, TODOS_OS_SEMESTRES } from './semestre-select';
import { TurmaCardAluno, TurmaCardProfessor } from './turma-cards';

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2].map((n) => (
        <div key={n} className="h-48 rounded-xl border border-border bg-secondary" />
      ))}
    </div>
  );
}

export function TurmasPage() {
  const { usuario } = useSession();
  const professor = usuario?.papel === 'PROFESSOR';
  const turmas = useTurmas();
  const [escolhido, setEscolhido] = useState<string>();
  const [folhaAberta, setFolhaAberta] = useState(false);

  const todas = turmas.data ?? [];
  const semestres = [...new Set(todas.map((t) => t.semestre))].sort().reverse();
  const semestre = escolhido ?? semestres[0] ?? TODOS_OS_SEMESTRES;
  const visiveis = semestre === TODOS_OS_SEMESTRES ? todas : todas.filter((t) => t.semestre === semestre);

  const acao = (
    <Button type="button" className="w-full sm:w-auto" onClick={() => setFolhaAberta(true)}>
      {professor ? 'Nova turma' : 'Entrar em turma'}
    </Button>
  );

  const contador = professor
    ? plural(visiveis.length, 'turma')
    : `${plural(visiveis.length, 'turma')} ${visiveis.length === 1 ? 'inscrita' : 'inscritas'}`;

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="titulo-pagina" className="text-2xl font-bold text-primary">
          Minhas turmas
        </h2>
        {acao}
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
          mensagem={
            professor
              ? 'Você ainda não criou turmas.'
              : 'Você ainda não está em nenhuma turma. Peça o código ao professor e entre.'
          }
          acao={acao}
        />
      ) : null}

      {turmas.isSuccess && todas.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SemestreSelect semestres={semestres} valor={semestre} onChange={setEscolhido} />
            <span className="inline-flex min-h-8 w-fit items-center rounded-full bg-highlight px-3 text-sm font-semibold text-highlight-foreground">
              {contador}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visiveis.map((turma: Turma) =>
              professor ? <TurmaCardProfessor key={turma.id} turma={turma} /> : <TurmaCardAluno key={turma.id} turma={turma} />,
            )}
          </div>
        </>
      ) : null}

      {professor ? (
        <NovaTurmaSheet open={folhaAberta} onOpenChange={setFolhaAberta} aoCriar={(t) => setEscolhido(t.semestre)} />
      ) : (
        <EntrarEmTurmaSheet open={folhaAberta} onOpenChange={setFolhaAberta} aoEntrar={(t) => setEscolhido(t.semestre)} />
      )}
    </section>
  );
}

import { useId } from 'react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { useAlunosDaTurma } from '@/features/grupos/api';
import { iniciais, plural } from '@/lib/format';

/** Quem faz parte da turma: o professor e os alunos inscritos, em ordem alfabética. */
export function MembrosAba({ turmaId, professorNome }: { turmaId: string; professorNome: string }) {
  const idTitulo = useId();
  const alunos = useAlunosDaTurma(turmaId, true);

  return (
    <section aria-labelledby={idTitulo} className="space-y-4">
      <h3 id={idTitulo} className="text-xl font-semibold text-primary">
        Membros da turma
      </h3>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Professor</p>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          <Linha nome={professorNome} />
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {alunos.isSuccess ? `Alunos · ${plural(alunos.data.length, 'inscrito')}` : 'Alunos'}
        </p>
        {alunos.isPending ? (
          <div role="status" aria-label="Carregando" aria-busy="true" className="h-24 animate-pulse rounded-xl border border-border bg-secondary" />
        ) : null}
        {alunos.isError ? (
          <ErrorState mensagem="Não conseguimos carregar os membros. Tente de novo." onRetry={() => void alunos.refetch()} />
        ) : null}
        {alunos.isSuccess && alunos.data.length === 0 ? (
          <EmptyState mensagem="Nenhum aluno inscrito ainda. Quando alguém entrar com o código da turma, aparece aqui." />
        ) : null}
        {alunos.isSuccess && alunos.data.length > 0 ? (
          <ul aria-label="Alunos da turma" className="divide-y divide-border rounded-xl border border-border bg-card">
            {alunos.data.map((a) => (
              <Linha key={a.id} nome={a.nome} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function Linha({ nome }: { nome: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
        {iniciais(nome)}
      </span>
      <span className="text-sm font-medium text-foreground">{nome}</span>
    </li>
  );
}

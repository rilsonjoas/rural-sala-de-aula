import { useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useSession } from '@/features/session/use-session';
import {
  textoDasRegras,
  useConfiguracaoDeGrupos,
  useDecidirGrupo,
  useEntrarNoGrupo,
  useGrupos,
  type ConfiguracaoDeGrupos,
  type Grupo,
} from './api';
import { ConfiguracaoDosGrupos } from './configuracao-dos-grupos';
import { SairDoGrupo } from './sair-do-grupo';
import { SeloDoGrupo } from './selo-do-grupo';
import { SolicitarGrupoSheet } from './solicitar-grupo-sheet';

const mensagemDe = (e: unknown) => (e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
const nomes = (g: Grupo) => g.integrantes.map((i) => i.nome).join(', ');

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h4 id={id} className="text-base font-semibold text-primary">
        {titulo}
      </h4>
      {children}
    </section>
  );
}

const cartao = 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 sm:p-4';

export function GruposAba({ turmaId, professor }: { turmaId: string; professor: boolean }) {
  const grupos = useGrupos(turmaId);
  const configuracao = useConfiguracaoDeGrupos(turmaId);
  const [erroDeAcao, setErroDeAcao] = useState<string>();

  if (grupos.isError || configuracao.isError) {
    return (
      <ErrorState
        mensagem="Não conseguimos carregar os grupos. Verifique a conexão e tente de novo."
        onRetry={() => {
          void grupos.refetch();
          void configuracao.refetch();
        }}
      />
    );
  }
  if (!grupos.data || !configuracao.data) {
    return <div role="status" aria-label="Carregando" aria-busy="true" className="h-32 animate-pulse rounded-xl border border-border bg-secondary" />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h3 className="text-xl font-semibold text-primary">Grupos</h3>
        <p className="text-sm text-muted-foreground">{textoDasRegras(configuracao.data)}</p>
      </div>
      {erroDeAcao ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroDeAcao}
        </p>
      ) : null}
      {professor ? (
        <VisaoDoProfessor turmaId={turmaId} grupos={grupos.data} configuracao={configuracao.data} aoFalhar={setErroDeAcao} />
      ) : (
        <VisaoDoAluno turmaId={turmaId} grupos={grupos.data} configuracao={configuracao.data} aoFalhar={setErroDeAcao} />
      )}
    </div>
  );
}

type Props = { turmaId: string; grupos: Grupo[]; configuracao: ConfiguracaoDeGrupos; aoFalhar: (mensagem?: string) => void };

function VisaoDoAluno({ turmaId, grupos, configuracao, aoFalhar }: Props) {
  const { usuario } = useSession();
  const entrar = useEntrarNoGrupo(turmaId);
  const meu = grupos.find((g) => g.status !== 'REPROVADO' && g.integrantes.some((i) => i.id === usuario?.id));
  const anteriores = grupos.filter((g) => g.status === 'REPROVADO' && g.integrantes.some((i) => i.id === usuario?.id));
  const abertos = grupos.filter((g) => g.status === 'APROVADO' && g.id !== meu?.id);

  async function entrarNo(grupo: Grupo) {
    aoFalhar(undefined);
    try {
      await entrar.mutateAsync(grupo.id);
      toast.success(`Você entrou em ${grupo.nome}`);
    } catch (e) {
      aoFalhar(mensagemDe(e));
    }
  }

  return (
    <>
      {meu ? (
        <section aria-label="Meu grupo" className={`${cartao} border-primary`}>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-primary">{meu.nome}</p>
            <p className="text-sm text-muted-foreground">{nomes(meu)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeloDoGrupo status={meu.status} />
            <SairDoGrupo turmaId={turmaId} grupo={meu} />
          </div>
        </section>
      ) : (
        <div>
          <SolicitarGrupoSheet turmaId={turmaId} configuracao={configuracao} />
        </div>
      )}

      {anteriores.length > 0 ? (
        <Bloco titulo="Solicitações anteriores">
          {anteriores.map((g) => (
            <div key={g.id} className={cartao}>
              <div className="min-w-0">
                <p className="font-medium">{g.nome}</p>
                <p className="text-sm text-muted-foreground">{nomes(g)}</p>
              </div>
              <SeloDoGrupo status={g.status} />
            </div>
          ))}
        </Bloco>
      ) : null}

      {abertos.length > 0 ? (
        <Bloco titulo="Grupos aprovados">
          {abertos.map((g) => (
            <div key={g.id} className={cartao}>
              <div className="min-w-0">
                <p className="font-medium">{g.nome}</p>
                <p className="text-sm text-muted-foreground">{`${g.integrantes.length} de ${configuracao.maximoIntegrantes} integrantes`}</p>
              </div>
              {!meu && g.integrantes.length < configuracao.maximoIntegrantes ? (
                <Button type="button" variant="outline" size="sm" disabled={entrar.isPending} onClick={() => void entrarNo(g)} aria-label={`Entrar no grupo ${g.nome}`}>
                  Entrar
                </Button>
              ) : null}
            </div>
          ))}
        </Bloco>
      ) : null}

      {!meu && abertos.length === 0 && anteriores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há grupos aprovados. Peça um grupo com seus colegas e o professor decide.</p>
      ) : null}
    </>
  );
}

function VisaoDoProfessor({ turmaId, grupos, configuracao, aoFalhar }: Props) {
  const decidir = useDecidirGrupo(turmaId);
  const pendentes = grupos.filter((g) => g.status === 'PENDENTE');
  const aprovados = grupos.filter((g) => g.status === 'APROVADO');

  async function decidirSobre(grupo: Grupo, aprovado: boolean) {
    aoFalhar(undefined);
    try {
      await decidir.mutateAsync({ grupoId: grupo.id, aprovado });
      toast.success(aprovado ? `${grupo.nome} aprovado` : `${grupo.nome} não aprovado`);
    } catch (e) {
      aoFalhar(mensagemDe(e));
    }
  }

  return (
    <>
      <ConfiguracaoDosGrupos turmaId={turmaId} configuracao={configuracao} />

      {pendentes.length > 0 ? (
        <Bloco titulo="Solicitações pendentes">
          {pendentes.map((g) => (
            <div key={g.id} className={cartao}>
              <div className="min-w-0">
                <p className="font-medium">{g.nome}</p>
                <p className="text-sm text-muted-foreground">{nomes(g)}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={decidir.isPending} onClick={() => void decidirSobre(g, true)} aria-label={`Aprovar ${g.nome}`}>
                  Aprovar
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={decidir.isPending} onClick={() => void decidirSobre(g, false)} aria-label={`Reprovar ${g.nome}`}>
                  Reprovar
                </Button>
              </div>
            </div>
          ))}
        </Bloco>
      ) : null}

      {aprovados.length > 0 ? (
        <Bloco titulo="Grupos aprovados">
          {aprovados.map((g) => (
            <div key={g.id} className={cartao}>
              <div className="min-w-0">
                <p className="font-medium">{g.nome}</p>
                <p className="text-sm text-muted-foreground">{nomes(g)}</p>
              </div>
              <span className="text-sm text-muted-foreground">{`${g.integrantes.length} de ${configuracao.maximoIntegrantes} integrantes`}</span>
            </div>
          ))}
        </Bloco>
      ) : null}

      {grupos.length === 0 ? (
        <EmptyState mensagem="Nenhum grupo por enquanto. As solicitações dos alunos aparecem aqui." />
      ) : null}
    </>
  );
}

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Campo } from '@/components/form-field';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/features/session/use-session';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useAlunosDaTurma, useSolicitarGrupo, type ConfiguracaoDeGrupos } from './api';

/** RF06: o aluno pede o grupo com nome e colegas; ele mesmo entra como integrante. O professor decide depois. */
export function SolicitarGrupoSheet({ turmaId, configuracao }: { turmaId: string; configuracao: ConfiguracaoDeGrupos }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [colegas, setColegas] = useState<string[]>([]);
  const [erro, setErro] = useState<string>();
  const { usuario } = useSession();
  const alunos = useAlunosDaTurma(turmaId, aberto);
  const solicitar = useSolicitarGrupo(turmaId);
  const disponiveis = (alunos.data ?? []).filter((a) => a.id !== usuario?.id);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(undefined);
    try {
      await solicitar.mutateAsync({ nome: nome.trim(), integrantesIds: colegas });
      setAberto(false);
      setNome('');
      setColegas([]);
      toast.success('Solicitação enviada. O professor vai decidir.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    }
  }

  const alternar = (id: string) => setColegas((atuais) => (atuais.includes(id) ? atuais.filter((c) => c !== id) : [...atuais, id]));

  return (
    <>
      <Button type="button" onClick={() => setAberto(true)}>
        Solicitar grupo
      </Button>
      <ResponsiveSheet open={aberto} onOpenChange={setAberto} titulo="Solicitar grupo">
        <form onSubmit={(e) => void enviar(e)} noValidate className="space-y-4">
          <Campo rotulo="Nome do grupo" obrigatorio>
            {(props) => <Input {...props} value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />}
          </Campo>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold text-primary">Colegas do grupo</legend>
            <p className="text-sm text-muted-foreground">
              {`Você entra automaticamente. O grupo precisa de ${configuracao.minimoIntegrantes} a ${configuracao.maximoIntegrantes} integrantes no total.`}
            </p>
            {alunos.isPending ? <p className="text-sm text-muted-foreground">Carregando colegas…</p> : null}
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {disponiveis.map((a) => (
                <label key={a.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
                  <input type="checkbox" checked={colegas.includes(a.id)} onChange={() => alternar(a.id)} className="size-4" />
                  {a.nome}
                </label>
              ))}
            </div>
          </fieldset>

          {erro ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={solicitar.isPending}>
            {solicitar.isPending ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </form>
      </ResponsiveSheet>
    </>
  );
}

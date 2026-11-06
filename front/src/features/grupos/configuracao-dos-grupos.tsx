import { useState, type FormEvent } from 'react';
import { Campo } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useSalvarConfiguracao, type ConfiguracaoDeGrupos } from './api';

/** RF12: o professor define mínimo, máximo e limite de grupos. Mudar a regra não desfaz grupos já aprovados. */
export function ConfiguracaoDosGrupos({ turmaId, configuracao }: { turmaId: string; configuracao: ConfiguracaoDeGrupos }) {
  const [minimo, setMinimo] = useState(String(configuracao.minimoIntegrantes));
  const [maximo, setMaximo] = useState(String(configuracao.maximoIntegrantes));
  const [limite, setLimite] = useState(configuracao.maximoGrupos == null ? '' : String(configuracao.maximoGrupos));
  const [erro, setErro] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const salvar = useSalvarConfiguracao(turmaId);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(undefined);
    setSalvo(false);
    try {
      await salvar.mutateAsync({
        minimoIntegrantes: Number(minimo),
        maximoIntegrantes: Number(maximo),
        maximoGrupos: limite.trim() === '' ? null : Number(limite),
      });
      setSalvo(true);
    } catch (e) {
      setErro(e instanceof ApiError ? (e.campos?.[0]?.mensagem ?? e.message) : MENSAGEM_PADRAO);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} noValidate aria-label="Regras de formação" className="space-y-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      <h4 className="text-base font-semibold text-primary">Regras de formação</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Mínimo de integrantes">
          {(props) => <Input {...props} type="number" min={1} inputMode="numeric" value={minimo} onChange={(e) => setMinimo(e.target.value)} />}
        </Campo>
        <Campo rotulo="Máximo de integrantes">
          {(props) => <Input {...props} type="number" min={1} inputMode="numeric" value={maximo} onChange={(e) => setMaximo(e.target.value)} />}
        </Campo>
        <Campo rotulo="Limite de grupos da turma" dica="Em branco, não há limite.">
          {(props) => <Input {...props} type="number" min={1} inputMode="numeric" value={limite} onChange={(e) => setLimite(e.target.value)} />}
        </Campo>
      </div>
      {erro ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {salvo ? (
        <p role="status" className="text-sm font-medium text-success">
          Regras salvas.
        </p>
      ) : null}
      <Button type="submit" disabled={salvar.isPending}>
        {salvar.isPending ? 'Salvando…' : 'Salvar regras'}
      </Button>
    </form>
  );
}

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useSairDoGrupo, type Grupo } from './api';

/** RF07: o aluno sai do grupo. A API recusa se um grupo aprovado ficaria abaixo do mínimo; a mensagem aparece na folha. */
export function SairDoGrupo({ turmaId, grupo }: { turmaId: string; grupo: Grupo }) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string>();
  const sair = useSairDoGrupo(turmaId);

  async function confirmar() {
    setErro(undefined);
    try {
      await sair.mutateAsync(grupo.id);
      setAberto(false);
      toast.success(`Você saiu de ${grupo.nome}`);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setAberto(true)}>
        <LogOut aria-hidden="true" className="size-4" />
        Sair do grupo
      </Button>
      <ResponsiveSheet open={aberto} onOpenChange={setAberto} titulo="Sair do grupo?" descricao={grupo.nome}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/80">Você deixa de fazer parte deste grupo. Depois, pode pedir ou entrar em outro.</p>
          {erro ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={sair.isPending} onClick={() => void confirmar()}>
              {sair.isPending ? 'Saindo…' : 'Confirmar saída'}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </>
  );
}

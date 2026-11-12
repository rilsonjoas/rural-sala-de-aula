import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useExcluirTurma } from './api';

type Props = { turmaId: string; turmaNome: string };

/** O professor exclui a turma: atividades, entregas, avisos, grupos e inscrições saem junto, sem volta. */
export function ExcluirTurma({ turmaId, turmaNome }: Props) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string>();
  const navigate = useNavigate();
  const excluir = useExcluirTurma(turmaId);

  async function confirmar() {
    setErro(undefined);
    try {
      await excluir.mutateAsync();
      setAberto(false);
      toast.success(`Turma ${turmaNome} excluída`);
      navigate('/turmas', { replace: true });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-9 text-destructive" onClick={() => setAberto(true)}>
        <Trash2 aria-hidden="true" className="size-4" />
        Excluir turma
      </Button>
      <ResponsiveSheet open={aberto} onOpenChange={setAberto} titulo="Excluir a turma?" descricao={turmaNome}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/80">
            Isso apaga <strong>para todos</strong> as atividades, as entregas enviadas (e os arquivos), os avisos, os comentários, os
            grupos e as inscrições desta turma. Não tem volta.
          </p>
          {erro ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={excluir.isPending} onClick={() => void confirmar()}>
              {excluir.isPending ? 'Excluindo…' : 'Excluir turma'}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </>
  );
}

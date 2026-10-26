import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useSairDaTurma } from './api';

type Props = { turmaId: string; turmaNome: string };

/** RF03b: o aluno sai da turma. Entregas e notas ficam com a turma; para voltar, basta o código. */
export function SairDaTurma({ turmaId, turmaNome }: Props) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string>();
  const navigate = useNavigate();
  const sair = useSairDaTurma(turmaId);

  async function confirmar() {
    setErro(undefined);
    try {
      await sair.mutateAsync();
      setAberto(false);
      toast.success(`Você saiu de ${turmaNome}`);
      navigate('/turmas', { replace: true });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-9" onClick={() => setAberto(true)}>
        <LogOut aria-hidden="true" className="size-4" />
        Sair da turma
      </Button>
      <ResponsiveSheet open={aberto} onOpenChange={setAberto} titulo="Sair da turma?" descricao={turmaNome}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/80">
            Você deixa de ver o mural e as atividades desta turma. As entregas que você já enviou e as notas ficam com o
            professor. Para voltar, é só entrar de novo com o código da turma.
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
            <Button type="button" variant="destructive" disabled={sair.isPending} onClick={() => void confirmar()}>
              {sair.isPending ? 'Saindo…' : 'Sair da turma'}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Campo } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { api } from '@/lib/api-client';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { useSession } from './use-session';

/** Exclui a própria conta, depois de confirmar a senha. Quem ainda leciona turmas recebe o aviso da API (409). */
export function ExcluirConta({ aberto, aoMudar }: { aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  const { limparSessao } = useSession();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setErro(undefined);
    setEnviando(true);
    try {
      await api.POST('/me/exclusao', { body: { senha } });
      aoMudar(false);
      toast.success('Conta excluída.');
      limparSessao();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ResponsiveSheet open={aberto} onOpenChange={aoMudar} titulo="Excluir minha conta?" descricao="Não tem volta.">
      <div className="space-y-4">
        <p className="text-sm text-foreground/80">
          Saem a sua conta, as suas inscrições, os seus grupos, as suas entregas individuais (com os arquivos) e os seus comentários.
          Se você leciona turmas, exclua-as antes.
        </p>
        <Campo rotulo="Sua senha">
          {(props) => <PasswordInput {...props} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />}
        </Campo>
        {erro ? (
          <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => aoMudar(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" disabled={!senha || enviando} onClick={() => void confirmar()}>
            {enviando ? 'Excluindo…' : 'Excluir minha conta'}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

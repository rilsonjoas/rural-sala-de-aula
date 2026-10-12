import { FileText } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { NomeDeArquivo } from '@/components/nome-de-arquivo';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { AtividadeDetalhe } from '@/features/atividades/api';
import { ApiError, MENSAGEM_PADRAO } from '@/lib/api-error';
import { formatTamanho } from '@/lib/format';
import { useEnviarEntrega } from './api';
import { enviadaEm } from './entrega-formatos';
import { NotaChip } from './entrega-partes';
import { SeletorDeArquivo } from './seletor-de-arquivo';

function Barra() {
  return (
    <div role="progressbar" aria-label="Enviando arquivo" className="h-2 overflow-hidden rounded-full bg-secondary">
      <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
    </div>
  );
}

function Formulario({ atividade, trocando, aoTerminar }: { atividade: AtividadeDetalhe; trocando: boolean; aoTerminar: () => void }) {
  const enviar = useEnviarEntrega(atividade.id);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string>();
  const prazoPassou = new Date(atividade.prazoFinal).getTime() < Date.now();

  async function submeter() {
    if (!arquivo) return;
    setErro(undefined);
    try {
      await enviar.mutateAsync(arquivo);
      toast.success('Entrega enviada.');
      aoTerminar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : MENSAGEM_PADRAO);
    }
  }

  return (
    <div className="space-y-3">
      {trocando ? <p className="text-sm text-muted-foreground">O novo arquivo substitui o anterior.</p> : null}
      <SeletorDeArquivo arquivo={arquivo} onEscolher={setArquivo} desabilitado={enviar.isPending} />
      {prazoPassou ? <p className="text-sm text-destructive">Ao enviar agora, a entrega será marcada com atraso.</p> : null}
      {erro ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {enviar.isPending ? <Barra /> : null}
      <Button type="button" className="w-full sm:w-auto" disabled={!arquivo || enviar.isPending} onClick={() => void submeter()}>
        {enviar.isPending ? 'Enviando…' : 'Enviar entrega'}
      </Button>
    </div>
  );
}

export function SuaEntrega({ atividade }: { atividade: AtividadeDetalhe }) {
  const idTitulo = useId();
  const [trocando, setTrocando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const entrega = atividade.minhaEntrega;
  const avaliada = entrega?.nota != null;

  return (
    <section aria-labelledby={idTitulo} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 ref={titulo} id={idTitulo} tabIndex={-1} className="text-lg font-semibold text-primary outline-none">
        Sua entrega
      </h3>

      {entrega ? (
        <div className="space-y-3 rounded-lg bg-secondary p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium text-primary">
                <FileText aria-hidden="true" className="size-4 shrink-0" />
                <NomeDeArquivo nome={entrega.nomeOriginal} />
              </p>
              <p className="text-sm text-muted-foreground">{formatTamanho(entrega.tamanhoBytes)}</p>
              <p className="text-sm text-muted-foreground">{enviadaEm(entrega)}</p>
            </div>
            <StatusBadge estado={avaliada ? 'CONCLUIDA' : entrega.atrasada ? 'ENTREGUE_COM_ATRASO' : 'ENTREGUE'} />
          </div>
          {avaliada ? (
            <div className="space-y-2">
              <NotaChip nota={entrega.nota} />
              <div className="rounded-md bg-card p-3">
                <p className="text-sm font-semibold text-primary">Comentário do professor</p>
                <p className="text-sm text-foreground">{entrega.comentarioPrivado || 'Sem comentário.'}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {avaliada ? (
        <p className="text-sm text-muted-foreground">Esta entrega já foi avaliada e não aceita novo envio.</p>
      ) : entrega && !trocando ? (
        <Button type="button" variant="secondary" onClick={() => setTrocando(true)}>
          Enviar outro arquivo
        </Button>
      ) : (
        <Formulario
          atividade={atividade}
          trocando={trocando}
          aoTerminar={() => {
            setTrocando(false);
            // o botão de envio some: leva o foco ao título da seção, para não perder o lugar
            setTimeout(() => titulo.current?.focus(), 0);
          }}
        />
      )}
    </section>
  );
}

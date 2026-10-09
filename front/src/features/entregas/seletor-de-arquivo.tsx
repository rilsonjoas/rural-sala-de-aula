import { Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { NomeDeArquivo } from '@/components/nome-de-arquivo';
import { Button } from '@/components/ui/button';
import { formatTamanho } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ACCEPT, validarArquivo } from './arquivo';

type Props = {
  arquivo: File | null;
  onEscolher: (arquivo: File | null) => void;
  desabilitado?: boolean;
};

/** Escolhe (ou arrasta) o arquivo; valida tipo e tamanho na hora e só entrega ao pai um arquivo aceito. */
export function SeletorDeArquivo({ arquivo, onEscolher, desabilitado }: Props) {
  const idEntrada = useId();
  const idDica = `${idEntrada}-dica`;
  const entrada = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  function escolher(arquivoEscolhido: File | undefined) {
    if (!arquivoEscolhido) return;
    const problema = validarArquivo(arquivoEscolhido);
    setErro(problema);
    onEscolher(problema ? null : arquivoEscolhido);
    if (problema && entrada.current) entrada.current.value = '';
  }

  function remover() {
    if (entrada.current) entrada.current.value = '';
    setErro(null);
    onEscolher(null);
  }

  return (
    <div className="space-y-2">
      {arquivo ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3">
          <div className="min-w-0">
            <p className="font-medium text-primary">
              <NomeDeArquivo nome={arquivo.name} />
            </p>
            <p className="text-sm text-muted-foreground">{formatTamanho(arquivo.size)}</p>
          </div>
          <Button type="button" variant="ghost" onClick={remover} disabled={desabilitado}>
            Remover
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            escolher(e.dataTransfer.files[0]);
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input bg-card px-4 py-6 text-center',
            arrastando && 'border-primary bg-secondary',
          )}
        >
          <Upload aria-hidden="true" className="size-6 text-primary" />
          <label htmlFor={idEntrada} className="inline-flex min-h-11 cursor-pointer items-center rounded-md border-[1.5px] border-primary bg-card px-4 font-semibold text-primary focus-within:ring-2 focus-within:ring-ring">
            Escolher arquivo
          </label>
          <p id={idDica} className="text-sm text-muted-foreground">
            PDF, apresentação ou texto, até 25 MB
          </p>
          <input
            ref={entrada}
            id={idEntrada}
            type="file"
            accept={ACCEPT}
            aria-describedby={idDica}
            disabled={desabilitado}
            className="sr-only"
            onChange={(e) => escolher(e.target.files?.[0])}
          />
        </div>
      )}
      {erro ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

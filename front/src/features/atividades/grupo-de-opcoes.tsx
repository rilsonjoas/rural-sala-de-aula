import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type Opcao = { valor: string; rotulo: string; detalhe?: ReactNode };

type Props = { rotulo: string; opcoes: Opcao[]; registro: UseFormRegisterReturn; obrigatorio?: boolean; erro?: string };

/** Escolha única em botões lado a lado (radios nativos): o marcado ganha fundo azul e um ícone de check. */
export function GrupoDeOpcoes({ rotulo, opcoes, registro, obrigatorio, erro }: Props) {
  const idRotulo = `rotulo-${registro.name}`;
  return (
    <div className="space-y-1.5">
      <span id={idRotulo} className={`text-sm font-semibold text-primary ${obrigatorio ? "after:ml-0.5 after:text-destructive after:content-['*']" : ''}`}>
        {rotulo}
      </span>
      <div role="radiogroup" aria-labelledby={idRotulo} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {opcoes.map((opcao) => (
          <label key={opcao.valor} className="group cursor-pointer">
            <input type="radio" value={opcao.valor} className="peer sr-only" {...registro} />
            <span className="flex min-h-11 sm:min-h-12 flex-col items-center justify-center gap-1 rounded-md border border-input bg-card p-2 text-center text-xs sm:text-sm font-semibold text-primary transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 group-has-[input:checked]:border-primary group-has-[input:checked]:bg-primary group-has-[input:checked]:text-primary-foreground">
              <span className="inline-flex items-center justify-center gap-1 text-center leading-tight">
                <Check aria-hidden="true" className="hidden size-3.5 shrink-0 group-has-[input:checked]:block" />
                <span>{opcao.rotulo}</span>
              </span>
              {opcao.detalhe}
            </span>
          </label>
        ))}
      </div>
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </div>
  );
}

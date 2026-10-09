import { AlertCircle } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type PropsDoControle = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string };

type Props = {
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  children: (props: PropsDoControle) => ReactNode;
};

/** Rótulo sempre visível, dica e erro ligados ao controle por aria-describedby. */
export function Campo({ rotulo, erro, dica, obrigatorio, children }: Props) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  const descrito = [dica ? idDica : null, erro ? idErro : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-primary">
        {rotulo}
        {obrigatorio ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {children({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': descrito })}
      {dica ? (
        <p id={idDica} className="text-sm text-muted-foreground">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={idErro} className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {erro}
        </p>
      ) : null}
    </div>
  );
}

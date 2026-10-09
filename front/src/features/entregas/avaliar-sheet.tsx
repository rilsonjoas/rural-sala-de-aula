import { zodResolver } from '@hookform/resolvers/zod';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Campo } from '@/components/form-field';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { aplicarErroDaApi } from '@/lib/form-errors';
import { formatNota } from '@/lib/format';
import { useAvaliarEntrega, type Entrega } from './api';

const schema = z.object({
  nota: z
    .string()
    .trim()
    .min(1, 'Informe a nota.')
    .superRefine((valor, ctx) => {
      const numero = Number(valor.replace(',', '.'));
      if (!/^\d+([.,]\d+)?$/.test(valor) || numero < 0 || numero > 10) {
        ctx.addIssue({ code: 'custom', message: 'A nota deve estar entre 0 e 10.' });
      } else if (!/^\d+([.,]\d)?$/.test(valor)) {
        ctx.addIssue({ code: 'custom', message: 'Use no máximo uma casa decimal.' });
      }
    }),
  comentarioPrivado: z.string().optional(),
});
type Valores = z.infer<typeof schema>;

type Props = { entrega: Entrega | null; onOpenChange: (aberto: boolean) => void };

export function AvaliarSheet({ entrega, onOpenChange }: Props) {
  return (
    <ResponsiveSheet open={entrega !== null} onOpenChange={onOpenChange} titulo="Avaliar entrega">
      {entrega ? <Conteudo key={entrega.id} entrega={entrega} aoConcluir={() => onOpenChange(false)} /> : null}
    </ResponsiveSheet>
  );
}

function Conteudo({ entrega, aoConcluir }: { entrega: Entrega; aoConcluir: () => void }) {
  const avaliar = useAvaliarEntrega();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nota: entrega.nota != null ? formatNota(entrega.nota) : '',
      comentarioPrivado: entrega.comentarioPrivado ?? '',
    },
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (valores) => {
    setErroGeral(undefined);
    try {
      await avaliar.mutateAsync({
        entregaId: entrega.id,
        nota: Number(valores.nota.replace(',', '.')),
        comentarioPrivado: valores.comentarioPrivado?.trim() || undefined,
      });
      toast.success('Avaliação salva.');
      aoConcluir();
    } catch (erro) {
      setErroGeral(aplicarErroDaApi(form, erro));
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <div className="space-y-1 rounded-lg bg-secondary p-3">
        <p className="font-semibold text-primary">{entrega.alunoNome}</p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText aria-hidden="true" className="size-4 shrink-0" />
          {entrega.nomeOriginal}
        </p>
      </div>

      <Campo rotulo="Nota (0 a 10)" obrigatorio erro={errors.nota?.message}>
        {(props) => <Input {...props} inputMode="decimal" autoComplete="off" {...form.register('nota')} />}
      </Campo>
      <Campo rotulo="Comentário privado" dica="Só o aluno vê este comentário">
        {(props) => <Textarea {...props} {...form.register('comentarioPrivado')} />}
      </Campo>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar avaliação'}
      </Button>
    </form>
  );
}

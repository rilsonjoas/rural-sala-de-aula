import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Campo } from '@/components/form-field';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aplicarErroDaApi } from '@/lib/form-errors';
import { useEntrarNaTurma, type Turma } from './api';

const schema = z.object({ codigo: z.string().trim().min(1, 'Informe o código da turma.') });
type Valores = z.infer<typeof schema>;

type Props = { open: boolean; onOpenChange: (aberto: boolean) => void; aoEntrar: (turma: Turma) => void };

export function EntrarEmTurmaSheet({ open, onOpenChange, aoEntrar }: Props) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} titulo="Entrar em turma">
      <Conteudo
        aoEntrar={(turma) => {
          aoEntrar(turma);
          onOpenChange(false);
          toast.success(`Você entrou em ${turma.nome}`);
        }}
      />
    </ResponsiveSheet>
  );
}

function Conteudo({ aoEntrar }: { aoEntrar: (turma: Turma) => void }) {
  const entrar = useEntrarNaTurma();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<Valores>({ resolver: zodResolver(schema), mode: 'onBlur', defaultValues: { codigo: '' } });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async ({ codigo }) => {
    setErroGeral(undefined);
    try {
      // Maiúsculas e espaços não importam: o código é normalizado antes de ir para a API.
      aoEntrar(await entrar.mutateAsync(codigo.replace(/\s+/g, '').toUpperCase()));
    } catch (erro) {
      setErroGeral(aplicarErroDaApi(form, erro, { campoPorStatus: { 404: 'codigo', 409: 'codigo' } }));
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo rotulo="Código da turma" dica="Peça o código ao professor" erro={errors.codigo?.message}>
        {(props) => (
          <Input {...props} autoCapitalize="characters" autoComplete="off" className="uppercase" {...form.register('codigo')} />
        )}
      </Campo>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar na turma'}
      </Button>
    </form>
  );
}

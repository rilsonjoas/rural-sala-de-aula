import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Campo } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ME_QUERY_KEY } from '@/features/session/use-session';
import { api } from '@/lib/api-client';
import { aplicarErroDaApi } from '@/lib/form-errors';
import { registroSchema, type RegistroValores } from './schemas';

const PAPEIS = [
  { valor: 'ALUNO', titulo: 'Aluno', descricao: 'Entro em turmas e entrego atividades' },
  { valor: 'PROFESSOR', titulo: 'Professor', descricao: 'Crio turmas e avalio entregas' },
] as const;

export function RegisterForm() {
  const queryClient = useQueryClient();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<RegistroValores>({
    resolver: zodResolver(registroSchema),
    mode: 'onBlur',
    defaultValues: { nome: '', email: '', senha: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (valores) => {
    setErroGeral(undefined);
    try {
      const { data } = await api.POST('/auth/register', { body: valores });
      queryClient.setQueryData(ME_QUERY_KEY, data);
    } catch (erro) {
      setErroGeral(aplicarErroDaApi(form, erro, { campoPorStatus: { 409: 'email' } }));
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo rotulo="Nome" erro={errors.nome?.message}>
        {(props) => <Input {...props} autoComplete="name" {...form.register('nome')} />}
      </Campo>
      <Campo rotulo="E-mail" erro={errors.email?.message}>
        {(props) => <Input {...props} type="email" autoComplete="email" {...form.register('email')} />}
      </Campo>
      <Campo rotulo="Senha" dica="Mínimo de 8 caracteres" erro={errors.senha?.message}>
        {(props) => <PasswordInput {...props} autoComplete="new-password" {...form.register('senha')} />}
      </Campo>

      <div className="space-y-1.5">
        <span id="rotulo-papel" className="text-sm font-semibold text-primary">
          Eu sou
        </span>
        <div role="radiogroup" aria-labelledby="rotulo-papel" className="grid grid-cols-2 gap-3">
          {PAPEIS.map(({ valor, titulo, descricao }) => (
            <label key={valor} className="group cursor-pointer">
              <input type="radio" value={valor} className="peer sr-only" {...form.register('papel')} />
              <span className="relative flex h-full flex-col gap-1 rounded-lg border border-input bg-card p-3 peer-checked:border-2 peer-checked:border-primary peer-checked:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="absolute right-2 top-2 size-4 text-primary opacity-0 group-has-[input:checked]:opacity-100"
                />
                <span className="font-semibold text-primary">{titulo}</span>
                <span className="text-sm text-muted-foreground">{descricao}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.papel ? (
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {errors.papel.message}
          </p>
        ) : null}
      </div>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Campo } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ME_QUERY_KEY } from '@/features/session/use-session';
import { api } from '@/lib/api-client';
import { aplicarErroDaApi } from '@/lib/form-errors';
import { loginSchema, type LoginValores } from './schemas';

export function LoginForm() {
  const queryClient = useQueryClient();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<LoginValores>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', senha: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (valores) => {
    setErroGeral(undefined);
    try {
      const { data } = await api.POST('/auth/login', { body: valores });
      // Com o usuário na sessão, a guarda PublicOnly leva a pessoa para dentro do app.
      queryClient.setQueryData(ME_QUERY_KEY, data);
    } catch (erro) {
      setErroGeral(aplicarErroDaApi(form, erro));
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo rotulo="E-mail" erro={errors.email?.message}>
        {(props) => (
          <Input {...props} type="email" autoComplete="email" placeholder="exemplo@universidade.br" {...form.register('email')} />
        )}
      </Campo>
      <Campo rotulo="Senha" erro={errors.senha?.message}>
        {(props) => <PasswordInput {...props} autoComplete="current-password" placeholder="Sua senha" {...form.register('senha')} />}
      </Campo>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
        {isSubmitting ? null : <ArrowRight aria-hidden="true" className="size-5" />}
      </Button>
    </form>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
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

export function RegisterForm() {
  const queryClient = useQueryClient();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<RegistroValores>({
    resolver: zodResolver(registroSchema),
    mode: 'onBlur',
    defaultValues: { nome: '', email: '', senha: '', dataNascimento: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (valores) => {
    setErroGeral(undefined);
    try {
      const payload = {
        ...valores,
        dataNascimento: valores.dataNascimento ? valores.dataNascimento : undefined,
      };
      const { data } = await api.POST('/auth/register', { body: payload });
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
      <Campo rotulo="Data de nascimento (opcional)" erro={errors.dataNascimento?.message}>
        {(props) => <Input {...props} type="date" {...form.register('dataNascimento')} />}
      </Campo>

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

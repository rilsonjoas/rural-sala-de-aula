import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { messages as copy } from '@/i18n/messages';
import { usePageTitle } from '@/lib/use-page-title';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

const GATILHO =
  'min-h-11 text-base font-semibold text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground';

export function AuthPage() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  const [aba, setAba] = useState('entrar');
  usePageTitle(aba === 'entrar' ? 'Entrar' : 'Criar conta');

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <GraduationCap aria-hidden="true" className="mx-auto size-10 text-primary" />
        <h1 className="text-2xl font-bold text-primary">{copy.appName}</h1>
        <p className="text-muted-foreground">Ambiente Virtual de Aprendizagem</p>
      </div>

      {aviso ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {aviso}
        </p>
      ) : null}

      <h2 className="sr-only">{aba === 'entrar' ? 'Entrar' : 'Criar conta'}</h2>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="grid h-auto w-full grid-cols-2 bg-secondary p-1">
          <TabsTrigger value="entrar" className={GATILHO}>
            Entrar
          </TabsTrigger>
          <TabsTrigger value="criar" className={GATILHO}>
            Criar conta
          </TabsTrigger>
        </TabsList>
        <TabsContent value="entrar" className="rounded-xl border border-border bg-card p-5">
          <LoginForm />
        </TabsContent>
        <TabsContent value="criar" className="rounded-xl border border-border bg-card p-5">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

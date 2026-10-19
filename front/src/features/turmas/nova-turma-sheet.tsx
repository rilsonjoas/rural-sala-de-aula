import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Campo } from '@/components/form-field';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aplicarErroDaApi } from '@/lib/form-errors';
import { formatDias } from '@/lib/format';
import { useCriarTurma, type Turma } from './api';
import { CopiarCodigo } from './copiar-codigo';

const DIAS = [1, 2, 3, 4, 5, 6, 7];

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da turma.'),
  descricao: z.string().trim().optional(),
  semestre: z.string().regex(/^[0-9]{4}\.[12]$/, 'Use o formato 2026.1 ou 2026.2.'),
  diasAula: z.array(z.string()),
});
type Valores = z.infer<typeof schema>;

function semestreCorrente(agora = new Date()) {
  return `${agora.getFullYear()}.${agora.getMonth() < 6 ? 1 : 2}`;
}

type Props = { open: boolean; onOpenChange: (aberto: boolean) => void; aoCriar: (turma: Turma) => void };

export function NovaTurmaSheet({ open, onOpenChange, aoCriar }: Props) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} titulo="Nova turma">
      <NovaTurmaConteudo aoConcluir={() => onOpenChange(false)} aoCriar={aoCriar} />
    </ResponsiveSheet>
  );
}

function NovaTurmaConteudo({ aoConcluir, aoCriar }: { aoConcluir: () => void; aoCriar: (turma: Turma) => void }) {
  const criar = useCriarTurma();
  const [criada, setCriada] = useState<Turma>();
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { nome: '', descricao: '', semestre: semestreCorrente(), diasAula: [] },
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (valores) => {
    setErroGeral(undefined);
    try {
      const turma = await criar.mutateAsync({
        nome: valores.nome,
        disciplina: valores.nome,
        descricao: valores.descricao?.trim() ? valores.descricao.trim() : undefined,
        semestre: valores.semestre,
        diasAula: valores.diasAula.map(Number),
      });
      setCriada(turma);
      aoCriar(turma);
    } catch (erro) {
      setErroGeral(aplicarErroDaApi(form, erro));
    }
  });

  if (criada) {
    return (
      <div className="space-y-4" role="status">
        <p className="font-semibold text-primary">Turma criada. Código de inscrição: {criada.codigo}</p>
        <p className="text-sm text-muted-foreground">Passe este código aos alunos para que entrem na turma.</p>
        <div className="flex flex-wrap gap-3">
          {criada.codigo ? <CopiarCodigo codigo={criada.codigo} /> : null}
          <Button type="button" onClick={aoConcluir}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo rotulo="Nome da turma" obrigatorio dica="Ex: Programação Web, Cálculo 1 ou Algoritmos II (Manhã)" erro={errors.nome?.message}>
        {(props) => <Input {...props} {...form.register('nome')} />}
      </Campo>
      <Campo rotulo="Descrição" dica="Opcional. Ex: Sala 3, link do Meet, turno ou orientações." erro={errors.descricao?.message}>
        {(props) => <Input {...props} {...form.register('descricao')} />}
      </Campo>
      <Campo rotulo="Semestre" obrigatorio dica="Formato: 2026.1 ou 2026.2" erro={errors.semestre?.message}>
        {(props) => <Input {...props} inputMode="decimal" {...form.register('semestre')} />}
      </Campo>

      <div className="space-y-1.5">
        <span id="rotulo-dias" className="text-sm font-semibold text-primary">
          Dias de aula <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </span>
        <div role="group" aria-labelledby="rotulo-dias" className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
          {DIAS.map((dia) => {
            const rotulo = formatDias([dia]);
            return (
              <label key={dia} className="group cursor-pointer">
                <input type="checkbox" value={dia} className="peer sr-only" {...form.register('diasAula')} />
                <span className="flex min-h-10 sm:min-h-11 w-full items-center justify-center gap-1 rounded-md border border-input bg-card px-2 py-1.5 text-xs sm:text-sm font-semibold text-primary transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 group-has-[input:checked]:border-primary group-has-[input:checked]:bg-primary group-has-[input:checked]:text-primary-foreground">
                  <Check aria-hidden="true" className="hidden size-3.5 shrink-0 group-has-[input:checked]:block" />
                  <span>{rotulo}</span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.diasAula ? <p className="text-sm text-destructive">{errors.diasAula.message}</p> : null}
      </div>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full min-h-10 text-sm font-semibold" disabled={isSubmitting}>
        {isSubmitting ? 'Cadastrando…' : 'Cadastrar turma'}
      </Button>
    </form>
  );
}

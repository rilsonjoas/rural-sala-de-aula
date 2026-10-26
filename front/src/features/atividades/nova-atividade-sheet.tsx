import { zodResolver } from '@hookform/resolvers/zod';
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
import { formatDataHora, paraInputDataHora } from '@/lib/format';
import { useAtualizarAtividade, useCriarAtividade } from './api';
import { GrupoDeOpcoes } from './grupo-de-opcoes';
import { ROTULO_TIPO, type Atividade } from './filtros';

const MSG_PRAZO = 'O prazo final não pode ser antes de quando a atividade fica disponível.';

const schema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome da atividade.'),
    descricao: z.string().optional(),
    tipo: z.enum(['PROVA', 'LISTA_DE_EXERCICIO', 'PROJETO_INDIVIDUAL', 'PROJETO_EM_GRUPO']),
    disponivelEm: z.string().min(1, 'Informe quando a atividade fica disponível.'),
    prazoFinal: z.string().min(1, 'Informe o prazo final.'),
    aceitaAtraso: z.boolean(),
  })
  .refine((v) => !v.prazoFinal || !v.disponivelEm || new Date(v.prazoFinal) >= new Date(v.disponivelEm), {
    path: ['prazoFinal'],
    message: MSG_PRAZO,
  });
type Valores = z.infer<typeof schema>;

type Props = {
  turmaId: string;
  turmaNome: string;
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  /** Quando vem preenchida, a folha edita essa atividade (RF11) em vez de cadastrar uma nova. */
  atividade?: Atividade | null;
};

export function NovaAtividadeSheet({ turmaId, turmaNome, open, onOpenChange, atividade }: Props) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={atividade ? 'Editar atividade' : 'Nova atividade'}
      descricao={turmaNome}
    >
      <Conteudo turmaId={turmaId} atividade={atividade ?? undefined} aoConcluir={() => onOpenChange(false)} />
    </ResponsiveSheet>
  );
}

function Conteudo({ turmaId, atividade, aoConcluir }: { turmaId: string; atividade?: Atividade; aoConcluir: () => void }) {
  const edicao = Boolean(atividade);
  const criar = useCriarAtividade(turmaId);
  const atualizar = useAtualizarAtividade(atividade?.id ?? '');
  const mutacao = edicao ? atualizar : criar;
  const [passo, setPasso] = useState<'formulario' | 'confirmar'>('formulario');
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: atividade
      ? {
          nome: atividade.nome,
          descricao: atividade.descricao ?? '',
          tipo: atividade.tipo,
          disponivelEm: paraInputDataHora(new Date(atividade.disponivelEm)),
          prazoFinal: paraInputDataHora(new Date(atividade.prazoFinal)),
          aceitaAtraso: atividade.aceitaAtraso ?? true,
        }
      : {
          nome: '',
          descricao: '',
          tipo: 'LISTA_DE_EXERCICIO',
          disponivelEm: paraInputDataHora(new Date()),
          prazoFinal: '',
          aceitaAtraso: true,
        },
  });
  const { errors } = form.formState;

  const revisar = form.handleSubmit(() => {
    setErroGeral(undefined);
    setPasso('confirmar');
  });

  async function confirmar() {
    const v = form.getValues();
    setErroGeral(undefined);
    try {
      await mutacao.mutateAsync({
        nome: v.nome.trim(),
        ...(v.descricao?.trim() ? { descricao: v.descricao.trim() } : {}),
        tipo: v.tipo,
        disponivelEm: new Date(v.disponivelEm).toISOString(),
        prazoFinal: new Date(v.prazoFinal).toISOString(),
        aceitaAtraso: v.aceitaAtraso,
      });
      toast.success(edicao ? 'Atividade atualizada' : 'Atividade cadastrada');
      aoConcluir();
    } catch (erro) {
      const geral = aplicarErroDaApi(form, erro);
      if (geral) setErroGeral(geral);
      else setPasso('formulario');
    }
  }

  if (passo === 'confirmar') {
    const v = form.getValues();
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {edicao
            ? 'Confira as mudanças. Os alunos veem a atividade atualizada assim que você salvar.'
            : 'Confira antes de cadastrar. Você pode editar a atividade depois.'}
        </p>
        <div className="space-y-3 rounded-lg bg-secondary p-4">
          <p className="font-semibold text-primary">{v.nome}</p>
          <p className="text-sm text-muted-foreground">{ROTULO_TIPO[v.tipo]}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Disponível em</dt>
            <dd className="font-semibold text-primary">{formatDataHora(new Date(v.disponivelEm).toISOString())}</dd>
            <dt className="text-muted-foreground">Prazo final</dt>
            <dd className="font-semibold text-primary">{formatDataHora(new Date(v.prazoFinal).toISOString())}</dd>
            <dt className="text-muted-foreground">Envio com atraso</dt>
            <dd className="font-semibold text-primary">{v.aceitaAtraso ? 'Permitido' : 'Não aceita'}</dd>
          </dl>
        </div>

        {erroGeral ? (
          <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
            {erroGeral}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button type="button" onClick={() => void confirmar()} disabled={mutacao.isPending} className="sm:flex-1 min-h-10 text-sm font-semibold">
            {mutacao.isPending ? 'Salvando…' : edicao ? 'Confirmar e salvar' : 'Confirmar e cadastrar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPasso('formulario')} disabled={mutacao.isPending} className="sm:flex-1 min-h-10 text-sm">
            Voltar e editar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={revisar} noValidate className="space-y-4">
      <Campo rotulo="Nome da atividade" obrigatorio erro={errors.nome?.message}>
        {(props) => <Input {...props} {...form.register('nome')} />}
      </Campo>
      <Campo rotulo="Descrição">{(props) => <Textarea {...props} {...form.register('descricao')} />}</Campo>

      <GrupoDeOpcoes
        rotulo="Tipo de atividade"
        obrigatorio
        registro={form.register('tipo')}
        opcoes={[
          { valor: 'PROVA', rotulo: 'Prova' },
          { valor: 'LISTA_DE_EXERCICIO', rotulo: 'Lista de Exercício' },
          { valor: 'PROJETO_INDIVIDUAL', rotulo: 'Projeto Individual' },
          { valor: 'PROJETO_EM_GRUPO', rotulo: 'Projeto em Grupo' },
        ]}
      />

      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/40">
        <input
          id="aceita-atraso"
          type="checkbox"
          className="size-4 shrink-0 rounded border-input text-primary focus:ring-ring"
          {...form.register('aceitaAtraso')}
        />
        <label htmlFor="aceita-atraso" className="text-xs sm:text-sm font-medium text-primary cursor-pointer select-none leading-snug">
          Permitir envio com atraso após o prazo final
        </label>
      </div>

      <Campo rotulo="Disponível em" dica="Por padrão, agora." erro={errors.disponivelEm?.message}>
        {(props) => <Input {...props} type="datetime-local" {...form.register('disponivelEm')} />}
      </Campo>
      <Campo rotulo="Prazo final" obrigatorio erro={errors.prazoFinal?.message}>
        {(props) => <Input {...props} type="datetime-local" {...form.register('prazoFinal')} />}
      </Campo>

      {erroGeral ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
          {erroGeral}
        </p>
      ) : null}

      <Button type="submit" className="w-full min-h-10 text-sm font-semibold">
        {edicao ? 'Revisar alterações' : 'Cadastrar atividade'}
      </Button>
    </form>
  );
}

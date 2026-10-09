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
import { useCriarAtividade } from './api';
import { GrupoDeOpcoes } from './grupo-de-opcoes';
import { ROTULO_COMPLEXIDADE, ROTULO_MODALIDADE, ROTULO_TIPO } from './filtros';

const MSG_PRAZO = 'O prazo final não pode ser antes de quando a atividade fica disponível.';

const schema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome da atividade.'),
    descricao: z.string().optional(),
    tipo: z.enum(['ATIVIDADE', 'TRABALHO', 'PROVA']),
    complexidade: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
    modalidade: z.enum(['INDIVIDUAL', 'GRUPO']),
    disponivelEm: z.string().min(1, 'Informe quando a atividade fica disponível.'),
    prazoFinal: z.string().min(1, 'Informe o prazo final.'),
  })
  .refine((v) => !v.prazoFinal || !v.disponivelEm || new Date(v.prazoFinal) >= new Date(v.disponivelEm), {
    path: ['prazoFinal'],
    message: MSG_PRAZO,
  });
type Valores = z.infer<typeof schema>;

const Pontos = ({ cheios }: { cheios: number }) => (
  <span aria-hidden="true" className="flex gap-0.5">
    {[1, 2, 3].map((n) => (
      <span key={n} className={`h-1.5 w-4 rounded-full ${n <= cheios ? 'bg-current' : 'bg-current opacity-25'}`} />
    ))}
  </span>
);

type Props = { turmaId: string; turmaNome: string; open: boolean; onOpenChange: (aberto: boolean) => void };

export function NovaAtividadeSheet({ turmaId, turmaNome, open, onOpenChange }: Props) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} titulo="Nova atividade" descricao={turmaNome}>
      <Conteudo turmaId={turmaId} aoConcluir={() => onOpenChange(false)} />
    </ResponsiveSheet>
  );
}

function Conteudo({ turmaId, aoConcluir }: { turmaId: string; aoConcluir: () => void }) {
  const criar = useCriarAtividade(turmaId);
  const [passo, setPasso] = useState<'formulario' | 'confirmar'>('formulario');
  const [erroGeral, setErroGeral] = useState<string>();
  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      descricao: '',
      tipo: 'ATIVIDADE',
      complexidade: 'MEDIA',
      modalidade: 'INDIVIDUAL',
      disponivelEm: paraInputDataHora(new Date()),
      prazoFinal: '',
    },
  });
  const { errors } = form.formState;
  const modalidade = form.watch('modalidade');

  const revisar = form.handleSubmit(() => {
    setErroGeral(undefined);
    setPasso('confirmar');
  });

  async function confirmar() {
    const v = form.getValues();
    setErroGeral(undefined);
    try {
      await criar.mutateAsync({
        nome: v.nome.trim(),
        ...(v.descricao?.trim() ? { descricao: v.descricao.trim() } : {}),
        tipo: v.tipo,
        complexidade: v.complexidade,
        modalidade: v.modalidade,
        disponivelEm: new Date(v.disponivelEm).toISOString(),
        prazoFinal: new Date(v.prazoFinal).toISOString(),
      });
      toast.success('Atividade cadastrada');
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
          Confira antes de cadastrar. Nesta versão, depois de cadastrada a atividade não pode ser editada.
        </p>
        <div className="space-y-3 rounded-lg bg-secondary p-4">
          <p className="font-semibold text-primary">{v.nome}</p>
          <p className="text-sm text-muted-foreground">{`${ROTULO_TIPO[v.tipo]} · Complexidade ${ROTULO_COMPLEXIDADE[v.complexidade].toLowerCase()} · ${ROTULO_MODALIDADE[v.modalidade]}`}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Disponível em</dt>
            <dd className="font-semibold text-primary">{formatDataHora(new Date(v.disponivelEm).toISOString())}</dd>
            <dt className="text-muted-foreground">Prazo final</dt>
            <dd className="font-semibold text-primary">{formatDataHora(new Date(v.prazoFinal).toISOString())}</dd>
          </dl>
        </div>

        {erroGeral ? (
          <p role="alert" className="rounded-md border border-destructive/40 bg-danger-tint px-3 py-2 text-sm text-destructive">
            {erroGeral}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="button" onClick={() => void confirmar()} disabled={criar.isPending} className="sm:flex-1">
            {criar.isPending ? 'Cadastrando…' : 'Confirmar e cadastrar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPasso('formulario')} disabled={criar.isPending} className="sm:flex-1">
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
        rotulo="Tipo"
        obrigatorio
        registro={form.register('tipo')}
        opcoes={[
          { valor: 'ATIVIDADE', rotulo: 'Atividade' },
          { valor: 'TRABALHO', rotulo: 'Trabalho' },
          { valor: 'PROVA', rotulo: 'Prova' },
        ]}
      />
      <GrupoDeOpcoes
        rotulo="Complexidade"
        obrigatorio
        registro={form.register('complexidade')}
        opcoes={[
          { valor: 'BAIXA', rotulo: 'Baixa', detalhe: <Pontos cheios={1} /> },
          { valor: 'MEDIA', rotulo: 'Média', detalhe: <Pontos cheios={2} /> },
          { valor: 'ALTA', rotulo: 'Alta', detalhe: <Pontos cheios={3} /> },
        ]}
      />
      <GrupoDeOpcoes
        rotulo="Modalidade"
        registro={form.register('modalidade')}
        opcoes={[
          { valor: 'INDIVIDUAL', rotulo: 'Individual' },
          { valor: 'GRUPO', rotulo: 'Em grupo' },
        ]}
      />
      {modalidade === 'GRUPO' ? (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-primary">
          Grupos ainda não estão disponíveis; os alunos entregarão individualmente.
        </p>
      ) : null}

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

      <Button type="submit" className="w-full">
        Cadastrar atividade
      </Button>
    </form>
  );
}

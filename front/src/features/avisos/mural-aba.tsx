import { useState } from 'react';
import { CornerDownRight, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useSession } from '@/features/session/use-session';
import { formatDataHora, iniciais } from '@/lib/format';
import { useAvisos, useCriarAviso, useCriarComentario, type Aviso, type Comentario } from './api';

export function MuralAba({ turmaId, podePublicar }: { turmaId: string; podePublicar: boolean }) {
  const { usuario } = useSession();
  const avisosQuery = useAvisos(turmaId);
  const criarAviso = useCriarAviso(turmaId);
  const [textoAviso, setTextoAviso] = useState('');
  const [expandido, setExpandido] = useState(false);

  const avisos = avisosQuery.data ?? [];

  async function handlePostarAviso(e: React.FormEvent) {
    e.preventDefault();
    if (!textoAviso.trim()) return;
    await criarAviso.mutateAsync(textoAviso.trim());
    setTextoAviso('');
    setExpandido(false);
  }

  return (
    <div className="space-y-6">
      {/* Caixa de criação de aviso: só quem leciona publica (RF13) */}
      {podePublicar && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          {!expandido ? (
            <button
              type="button"
              onClick={() => setExpandido(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-input bg-secondary/50 px-4 py-3 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {iniciais(usuario?.nome ?? 'Eu')}
              </div>
              <span>Escreva um comunicado para a turma...</span>
            </button>
          ) : (
            <form onSubmit={handlePostarAviso} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {iniciais(usuario?.nome ?? 'Eu')}
                </div>
                <span className="text-sm font-semibold text-primary">{usuario?.nome}</span>
              </div>
              <Textarea
                placeholder="Escreva um comunicado ou orientação para a turma..."
                value={textoAviso}
                onChange={(e) => setTextoAviso(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpandido(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={!textoAviso.trim() || criarAviso.isPending}>
                  {criarAviso.isPending ? 'Postando…' : 'Postar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lista de avisos */}
      {avisos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">Nenhum aviso postado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <AvisoCard key={aviso.id} aviso={aviso} turmaId={turmaId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AvisoCard({ aviso, turmaId }: { aviso: Aviso; turmaId: string }) {
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const criarComentario = useCriarComentario(turmaId);
  const comentarios = aviso.comentarios ?? [];
  const raizes = comentarios.filter((c) => !c.comentarioPaiId);
  const respostasDe = (id: string) => comentarios.filter((c) => c.comentarioPaiId === id);

  async function handleComentar(e: React.FormEvent) {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;
    await criarComentario.mutateAsync({ avisoId: aviso.id, texto: comentarioTexto.trim() });
    setComentarioTexto('');
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {iniciais(aviso.autorNome)}
        </div>
        <div>
          <h3 className="font-semibold text-primary leading-tight">{aviso.autorNome}</h3>
          <p className="text-xs text-muted-foreground">{formatDataHora(aviso.horario)}</p>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{aviso.texto}</p>

      {/* Comentários */}
      <div className="border-t border-border pt-3 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <MessageSquare className="size-3.5" />
          <span>{comentarios.length} {comentarios.length === 1 ? 'comentário da turma' : 'comentários da turma'}</span>
        </div>

        {raizes.map((c) => (
          <div key={c.id} className="space-y-2">
            <ComentarioLinha comentario={c} />
            <div className="pl-8">
              <button
                type="button"
                onClick={() => setRespondendoA(respondendoA === c.id ? null : c.id)}
                className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                aria-label={`Responder a ${c.autorNome}`}
              >
                <CornerDownRight aria-hidden="true" className="size-3.5" />
                Responder
              </button>
            </div>
            {respostasDe(c.id).length > 0 ? (
              <div className="ml-8 space-y-2 border-l-2 border-border pl-3">
                {respostasDe(c.id).map((r) => (
                  <ComentarioLinha key={r.id} comentario={r} />
                ))}
              </div>
            ) : null}
            {respondendoA === c.id ? (
              <FormResposta
                autorNome={c.autorNome}
                pendente={criarComentario.isPending}
                aoEnviar={async (texto) => {
                  await criarComentario.mutateAsync({ avisoId: aviso.id, texto, comentarioPaiId: c.id });
                  setRespondendoA(null);
                }}
                aoCancelar={() => setRespondendoA(null)}
              />
            ) : null}
          </div>
        ))}

        {/* Formulário para comentar */}
        <form onSubmit={handleComentar} className="flex items-center gap-2 pt-1">
          <Input
            placeholder="Adicionar um comentário para a turma..."
            aria-label="Novo comentário"
            value={comentarioTexto}
            onChange={(e) => setComentarioTexto(e.target.value)}
            className="text-xs h-9"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={!comentarioTexto.trim() || criarComentario.isPending}
            className="shrink-0 size-9 p-0"
            aria-label="Enviar comentário"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </article>
  );
}

function ComentarioLinha({ comentario: c }: { comentario: Comentario }) {
  return (
    <div className="flex gap-2.5 text-sm pl-2">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">
        {iniciais(c.autorNome)}
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-xs text-primary">{c.autorNome}</span>
          <span className="text-[10px] text-muted-foreground">{formatDataHora(c.horario)}</span>
        </div>
        <p className="text-xs text-foreground">{c.texto}</p>
      </div>
    </div>
  );
}

function FormResposta({
  autorNome,
  pendente,
  aoEnviar,
  aoCancelar,
}: {
  autorNome: string;
  pendente: boolean;
  aoEnviar: (texto: string) => Promise<void>;
  aoCancelar: () => void;
}) {
  const [texto, setTexto] = useState('');
  return (
    <form
      className="ml-8 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (texto.trim()) void aoEnviar(texto.trim());
      }}
    >
      <Input
        autoFocus
        aria-label={`Resposta a ${autorNome}`}
        placeholder={`Responder a ${autorNome}...`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="text-xs h-9"
      />
      <Button type="submit" size="sm" disabled={!texto.trim() || pendente}>
        {pendente ? 'Enviando…' : 'Responder'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={aoCancelar}>
        Cancelar
      </Button>
    </form>
  );
}

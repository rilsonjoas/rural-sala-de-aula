import { useState } from 'react';
import { CornerDownRight, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDataHora, iniciais } from '@/lib/format';

export type ComentarioDaThread = {
  id: string;
  comentarioPaiId?: string | null;
  autorNome: string;
  texto: string;
  horario: string;
};

type Props = {
  comentarios: ComentarioDaThread[];
  aoComentar: (texto: string) => Promise<void>;
  aoResponder: (texto: string, paiId: string) => Promise<void>;
  pendente: boolean;
  placeholder: string;
};

/** Comentários com respostas em um nível só; serve ao mural (aviso) e à página da atividade. */
export function ComentariosThread({ comentarios, aoComentar, aoResponder, pendente, placeholder }: Props) {
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const raizes = comentarios.filter((c) => !c.comentarioPaiId);
  const respostasDe = (id: string) => comentarios.filter((c) => c.comentarioPaiId === id);

  async function handleComentar(e: React.FormEvent) {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;
    await aoComentar(comentarioTexto.trim());
    setComentarioTexto('');
  }

  return (
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
              pendente={pendente}
              aoEnviar={async (texto) => {
                await aoResponder(texto, c.id);
                setRespondendoA(null);
              }}
              aoCancelar={() => setRespondendoA(null)}
            />
          ) : null}
        </div>
      ))}

      <form onSubmit={handleComentar} className="flex items-center gap-2 pt-1">
        <Input
          placeholder={placeholder}
          aria-label="Novo comentário"
          value={comentarioTexto}
          onChange={(e) => setComentarioTexto(e.target.value)}
          className="text-xs h-9"
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={!comentarioTexto.trim() || pendente}
          className="shrink-0 size-9 p-0"
          aria-label="Enviar comentário"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function ComentarioLinha({ comentario: c }: { comentario: ComentarioDaThread }) {
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

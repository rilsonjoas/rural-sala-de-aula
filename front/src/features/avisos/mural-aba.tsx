import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ComentariosThread } from '@/features/comentarios/comentarios-thread';
import { useAlunosDaTurma, useGrupos } from '@/features/grupos/api';
import { useSession } from '@/features/session/use-session';
import { formatDataHora, iniciais } from '@/lib/format';
import { useAvisos, useCriarAviso, useCriarComentario, type Aviso } from './api';

export function MuralAba({ turmaId, podePublicar }: { turmaId: string; podePublicar: boolean }) {
  const { usuario } = useSession();
  const avisosQuery = useAvisos(turmaId);
  const criarAviso = useCriarAviso(turmaId);
  const [textoAviso, setTextoAviso] = useState('');
  const [expandido, setExpandido] = useState(false);
  const [direcionar, setDirecionar] = useState(false);
  const [gruposIds, setGruposIds] = useState<string[]>([]);
  const [alunosIds, setAlunosIds] = useState<string[]>([]);
  const grupos = useGrupos(podePublicar && expandido && direcionar ? turmaId : '');
  const alunos = useAlunosDaTurma(turmaId, podePublicar && expandido && direcionar);
  const gruposAtivos = (grupos.data ?? []).filter((g) => g.status !== 'REPROVADO');
  const semDestino = direcionar && gruposIds.length === 0 && alunosIds.length === 0;

  const avisos = avisosQuery.data?.pages.flatMap((pagina) => pagina.itens) ?? [];

  async function handlePostarAviso(e: React.FormEvent) {
    e.preventDefault();
    if (!textoAviso.trim() || semDestino) return;
    await criarAviso.mutateAsync({
      texto: textoAviso.trim(),
      ...(direcionar ? { gruposIds, alunosIds } : {}),
    });
    setTextoAviso('');
    setDirecionar(false);
    setGruposIds([]);
    setAlunosIds([]);
    setExpandido(false);
  }

  const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

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
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-primary">Para quem?</legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="destino-aviso" checked={!direcionar} onChange={() => setDirecionar(false)} />
                    Toda a turma
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="destino-aviso" checked={direcionar} onChange={() => setDirecionar(true)} />
                    Só para grupos ou alunos
                  </label>
                </div>
                {direcionar ? (
                  <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
                    <div role="group" aria-label="Grupos" className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Grupos</p>
                      {gruposAtivos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum grupo na turma.</p> : null}
                      {gruposAtivos.map((g) => (
                        <label key={g.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={gruposIds.includes(g.id)} onChange={() => setGruposIds((l) => alternar(l, g.id))} />
                          {g.nome}
                        </label>
                      ))}
                    </div>
                    <div role="group" aria-label="Alunos" className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Alunos</p>
                      {(alunos.data ?? []).map((a) => (
                        <label key={a.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={alunosIds.includes(a.id)} onChange={() => setAlunosIds((l) => alternar(l, a.id))} />
                          {a.nome}
                        </label>
                      ))}
                    </div>
                    {semDestino ? <p className="text-xs text-muted-foreground">Escolha ao menos um grupo ou aluno.</p> : null}
                  </div>
                ) : null}
              </fieldset>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpandido(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={!textoAviso.trim() || semDestino || criarAviso.isPending}>
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
          {avisosQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button type="button" variant="outline" disabled={avisosQuery.isFetchingNextPage} onClick={() => void avisosQuery.fetchNextPage()}>
                {avisosQuery.isFetchingNextPage ? 'Carregando…' : 'Carregar avisos mais antigos'}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AvisoCard({ aviso, turmaId }: { aviso: Aviso; turmaId: string }) {
  const criarComentario = useCriarComentario(turmaId);
  const comentarios = aviso.comentarios ?? [];

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

      {aviso.direcionado ? (
        <p className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
          {aviso.destinatarios ? `Só para: ${aviso.destinatarios.map((d) => d.nome).join(', ')}` : 'Aviso só para você e outros alunos escolhidos'}
        </p>
      ) : null}

      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{aviso.texto}</p>

      <ComentariosThread
        comentarios={comentarios}
        pendente={criarComentario.isPending}
        placeholder="Adicionar um comentário para a turma..."
        aoComentar={async (texto) => {
          await criarComentario.mutateAsync({ avisoId: aviso.id, texto });
        }}
        aoResponder={async (texto, paiId) => {
          await criarComentario.mutateAsync({ avisoId: aviso.id, texto, comentarioPaiId: paiId });
        }}
      />
    </article>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PerfilGamificacao } from './tipos';

interface ModalConquistasProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  perfil: PerfilGamificacao;
}

export function ModalConquistas({ aberto, onOpenChange, perfil }: ModalConquistasProps) {
  const porcentagemNivel = Math.round((perfil.entregasNoNivelAtual / 3) * 100);
  const conquistasDesbloqueadas = perfil.conquistas.filter((c) => c.desbloqueada).length;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-bold text-primary">
              Nível {perfil.nivel} · Estudante
            </DialogTitle>
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
              {perfil.xpTotal} XP
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Acompanhe sua consistência acadêmica e conquistas conquistadas nas turmas.
          </DialogDescription>
        </DialogHeader>

        {/* Nível e Progresso */}
        <div className="space-y-2 rounded-xl bg-muted/40 p-4 border border-border">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Próximo nível (Nível {perfil.nivel + 1})</span>
            <span className="text-muted-foreground">
              {perfil.entregasNoNivelAtual} / 3 entregas
            </span>
          </div>
          <Progress value={porcentagemNivel} aria-label="Progresso para o próximo nível" />
          <p className="text-xs text-muted-foreground pt-1">
            Falta{perfil.entregasParaSubirNivel === 1 ? '' : 'm'}{' '}
            <strong>{perfil.entregasParaSubirNivel}</strong> entrega
            {perfil.entregasParaSubirNivel === 1 ? '' : 's'} para subir de nível.
          </p>
        </div>

        {/* Streak de consistência */}
        {perfil.streakSemanas >= 2 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-foreground">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                {perfil.streakSemanas} semanas consecutivas em dia!
              </p>
              <p className="text-xs text-muted-foreground">
                Você manteve entregas no prazo sem acumular atrasos.
              </p>
            </div>
          </div>
        )}

        {/* Grade de Conquistas */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Conquistas Acadêmicas</h3>
            <span className="text-xs text-muted-foreground">
              {conquistasDesbloqueadas} de {perfil.conquistas.length} desbloqueadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {perfil.conquistas.map((conquista) => (
              <div
                key={conquista.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  conquista.desbloqueada
                    ? 'border-border bg-card shadow-xs'
                    : 'border-dashed border-border/70 bg-muted/20 opacity-70'
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xl ${
                    conquista.desbloqueada ? 'bg-primary/10' : 'bg-muted grayscale'
                  }`}
                  aria-hidden="true"
                >
                  {conquista.icone}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-semibold truncate text-foreground">
                      {conquista.titulo}
                    </h4>
                    {conquista.desbloqueada && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        OK
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {conquista.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


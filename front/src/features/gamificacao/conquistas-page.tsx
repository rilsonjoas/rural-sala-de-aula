import {
  Award,
  BookOpen,
  Check,
  Clock,
  Flame,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePageTitle } from '@/lib/use-page-title';
import { useGamificacao } from './use-gamificacao';

const ICONES_CONQUISTA: Record<string, LucideIcon> = {
  'primeiro-passo': Target,
  'pontualidade-rural': Clock,
  'sempre-adiante': Zap,
  'nota-destaque': Award,
  'semestre-em-dia': BookOpen,
  'espirito-equipe': Users,
};

export function ConquistasPage() {
  usePageTitle('Conquistas');
  const { perfil, carregando } = useGamificacao();

  const porcentagemNivel = Math.round((perfil.entregasNoNivelAtual / 3) * 100);
  const conquistasDesbloqueadas = perfil.conquistas.filter((c) => c.desbloqueada).length;

  if (carregando) {
    return (
      <div role="status" aria-label="Carregando" aria-busy="true" className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary border border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-secondary border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Conquistas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe seu nível acadêmico, consistência de entregas e medalhas nas turmas em que você estuda.
        </p>
      </div>

      {/* Card de Nível e XP */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {perfil.nivel}
              </span>
              <h3 className="text-lg font-bold text-foreground">
                Nível {perfil.nivel} · Estudante
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {perfil.entregasConcluidas} atividade{perfil.entregasConcluidas === 1 ? '' : 's'} entregue{perfil.entregasConcluidas === 1 ? '' : 's'} nas turmas que você cursa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold text-sm px-3 py-1">
              {perfil.xpTotal} XP Acumulados
            </Badge>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
            <span>Progresso para o Nível {perfil.nivel + 1}</span>
            <span className="text-muted-foreground">
              {perfil.entregasNoNivelAtual} / 3 entregas
            </span>
          </div>
          <Progress value={porcentagemNivel} aria-label="Progresso para o próximo nível" />
          <p className="text-xs text-muted-foreground">
            Falta{perfil.entregasParaSubirNivel === 1 ? '' : 'm'}{' '}
            <strong>{perfil.entregasParaSubirNivel}</strong> entrega
            {perfil.entregasParaSubirNivel === 1 ? '' : 's'} para avançar de nível.
          </p>
        </div>
      </div>

      {/* Card de Consistência (Streak) */}
      {perfil.streakSemanas >= 2 && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Flame className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              {perfil.streakSemanas} semanas consecutivas em dia!
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Você manteve um ritmo constante com entregas no prazo sem acumular atrasos.
            </p>
          </div>
        </div>
      )}

      {/* Seção das Conquistas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Medalhas Acadêmicas</h3>
          <span className="text-xs text-muted-foreground">
            {conquistasDesbloqueadas} de {perfil.conquistas.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {perfil.conquistas.map((conquista) => {
            const Icone = ICONES_CONQUISTA[conquista.id] ?? Award;
            return (
              <div
                key={conquista.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  conquista.desbloqueada
                    ? 'border-border bg-card shadow-xs'
                    : 'border-dashed border-border/80 bg-muted/20 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                      conquista.desbloqueada
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icone className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {conquista.titulo}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {conquista.descricao}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  {conquista.desbloqueada ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check className="size-3.5" aria-hidden="true" />
                      Conquistada
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Em progresso ({conquista.progressoAtual}/{conquista.progressoTotal})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

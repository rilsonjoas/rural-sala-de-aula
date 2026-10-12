import type { components } from '@/lib/api.generated';
import { cn } from '@/lib/utils';

export type Complexidade = components['schemas']['Complexidade'];

const NIVEIS: Record<Complexidade, { cheias: number; texto: string }> = {
  BAIXA: { cheias: 1, texto: 'Complexidade baixa' },
  MEDIA: { cheias: 2, texto: 'Complexidade média' },
  ALTA: { cheias: 3, texto: 'Complexidade alta' },
};

/** Três barras (1 a 3 preenchidas) em azul, mais o texto: sem verde, amarelo ou vermelho. */
export function ComplexidadeIndicator({ nivel }: { nivel: Complexidade }) {
  const { cheias, texto } = NIVEIS[nivel];

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {[1, 2, 3].map((posicao) => (
          <span
            key={posicao}
            data-barra={posicao <= cheias ? 'cheia' : 'vazia'}
            className={cn('h-3.5 w-1.5 rounded-full', posicao <= cheias ? 'bg-primary' : 'bg-secondary')}
          />
        ))}
      </span>
      {texto}
    </span>
  );
}

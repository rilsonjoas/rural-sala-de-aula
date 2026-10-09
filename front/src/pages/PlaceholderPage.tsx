import type { ReactNode } from 'react';

export type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="titulo-pagina" className="space-y-3">
      <h2 id="titulo-pagina" className="text-2xl font-bold text-primary">
        {title}
      </h2>
      <p className="max-w-prose text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

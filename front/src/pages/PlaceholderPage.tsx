import type { ReactNode } from 'react';

export type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page" aria-labelledby="page-title">
      <h2 id="page-title">{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  );
}

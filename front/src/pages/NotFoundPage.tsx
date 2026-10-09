import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { messages as copy } from '@/i18n/messages';

export function NotFoundPage() {
  return (
    <section aria-labelledby="titulo-pagina" className="space-y-4 py-8">
      <h2 id="titulo-pagina" className="text-2xl font-bold text-primary">
        {copy.notFound}
      </h2>
      <p className="text-muted-foreground">{copy.notFoundDescription}</p>
      <Button asChild>
        <Link to="/turmas">{copy.backToClasses}</Link>
      </Button>
    </section>
  );
}

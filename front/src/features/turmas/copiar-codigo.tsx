import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CopiarCodigo({ codigo }: { codigo: string }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.success('Código copiado');
    } catch {
      toast.error('Não foi possível copiar. Selecione o código e copie.');
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copiar}>
      <Copy aria-hidden="true" className="size-4" />
      Copiar código
    </Button>
  );
}

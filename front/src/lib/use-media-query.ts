import { useEffect, useState } from 'react';

export function useMediaQuery(consulta: string): boolean {
  const [corresponde, setCorresponde] = useState(() => window.matchMedia?.(consulta).matches ?? false);

  useEffect(() => {
    const lista = window.matchMedia?.(consulta);
    if (!lista) return;
    const atualizar = () => setCorresponde(lista.matches);
    atualizar();
    lista.addEventListener('change', atualizar);
    return () => lista.removeEventListener('change', atualizar);
  }, [consulta]);

  return corresponde;
}

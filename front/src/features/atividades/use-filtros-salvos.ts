import { useCallback, useState } from 'react';
import { lerFiltrosSalvos, type Filtros } from './filtros';

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null; // armazenamento bloqueado (janela privada etc.): segue sem lembrar
  }
}

/** Filtros e ordenação lembrados no navegador (RF05: a personalização é individual). */
export function useFiltrosSalvos(chave: string) {
  const [filtros, setFiltros] = useState<Filtros>(() => lerFiltrosSalvos(ler(chave)));

  const atualizar = useCallback(
    (novos: Filtros) => {
      setFiltros(novos);
      try {
        localStorage.setItem(chave, JSON.stringify(novos));
      } catch {
        // sem armazenamento: o filtro vale só nesta visita
      }
    },
    [chave],
  );

  return [filtros, atualizar] as const;
}

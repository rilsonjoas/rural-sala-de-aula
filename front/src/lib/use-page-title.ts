import { useEffect } from 'react';

const APP = 'Rural Sala de Aula';

/** Título do documento por tela (WCAG 2.4.2): "Minhas turmas · Rural Sala de Aula". */
export function usePageTitle(titulo: string | undefined) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${APP}` : APP;
    return () => {
      document.title = APP;
    };
  }, [titulo]);
}

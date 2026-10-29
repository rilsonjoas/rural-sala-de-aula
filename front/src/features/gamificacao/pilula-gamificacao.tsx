import { useState } from 'react';
import { useGamificacao } from './use-gamificacao';
import { ModalConquistas } from './modal-conquistas';

export function PilulaGamificacao() {
  const [modalAberto, setModalAberto] = useState(false);
  const { perfil, carregando } = useGamificacao();

  if (carregando) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        aria-label={`Perfil acadêmico: Nível ${perfil.nivel}, ${perfil.xpTotal} XP. Abrir detalhes e conquistas.`}
        className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {perfil.nivel}
        </span>
        <span>{perfil.xpTotal} XP</span>
        {perfil.streakSemanas >= 2 && (
          <span
            className="flex items-center text-xs"
            title={`${perfil.streakSemanas} semanas em dia`}
            aria-label={`${perfil.streakSemanas} semanas em dia`}
          >
            🔥
          </span>
        )}
      </button>

      <ModalConquistas
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        perfil={perfil}
      />
    </>
  );
}


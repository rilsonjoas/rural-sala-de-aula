import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SESSION_EXPIRED_EVENT } from '@/lib/api-client';
import { messages as copy } from '@/i18n/messages';
import { useSession } from './use-session';

/** Ouve o aviso do cliente da API e leva a pessoa de volta ao login, com a explicação. */
export function SessionWatcher() {
  const { limparSessao } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    function aoExpirar() {
      limparSessao();
      navigate('/entrar', { replace: true, state: { aviso: copy.sessionExpired } });
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, aoExpirar);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, aoExpirar);
  }, [limparSessao, navigate]);

  return null;
}

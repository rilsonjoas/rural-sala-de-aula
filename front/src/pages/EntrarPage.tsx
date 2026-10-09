import { useLocation } from 'react-router-dom';
import { messages as copy } from '@/i18n/messages';
import { PlaceholderPage } from './PlaceholderPage';

export function EntrarPage() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;

  return (
    <PlaceholderPage title={copy.signIn} description={copy.signInDescription}>
      {aviso ? <p role="alert">{aviso}</p> : null}
    </PlaceholderPage>
  );
}

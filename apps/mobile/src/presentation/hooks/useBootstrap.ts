import { useEffect, useState } from 'react';
import { useDependencies } from '../../composition/AppProviders';

/** Restaura a sessão do Keystore uma vez ao abrir o app; `true` quando a navegação pode aparecer. */
export function useBootstrap(): boolean {
  const { bootstrap } = useDependencies();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    bootstrap()
      .catch(() => {
        // Falha inesperada: segue sem sessão (a tela de entrada aparece).
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [bootstrap]);
  return ready;
}

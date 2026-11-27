import { useCallback, useRef, useState } from 'react';
import { useDependencies } from '../../composition/AppProviders';

/** "Sair": a guarda de rotas leva à tela de entrada assim que a sessão some do aparelho. */
export function useSignOut(): { readonly pending: boolean; readonly signOut: () => Promise<void> } {
  const { signOut: run } = useDependencies();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await run();
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [run]);

  return { pending, signOut };
}

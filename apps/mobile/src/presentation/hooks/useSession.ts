import type { Session, SessionEndReason } from '@bruzfin/core';
import { useSyncExternalStore } from 'react';
import { useDependencies } from '../../composition/AppProviders';

/** Sessão ativa (ou `null`); re-renderiza quando o usuário entra ou sai. */
export function useSession(): Session | null {
  const { sessionStore } = useDependencies();
  return useSyncExternalStore(
    (listener) => sessionStore.subscribe(listener),
    () => sessionStore.current(),
  );
}

/** Por que a última sessão terminou (`expired` mostra aviso na tela de entrada). */
export function useSessionEndReason(): SessionEndReason | null {
  const { sessionStore } = useDependencies();
  return useSyncExternalStore(
    (listener) => sessionStore.subscribe(listener),
    () => sessionStore.endReason(),
  );
}

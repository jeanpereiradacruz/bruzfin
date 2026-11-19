import type { AuthorizationMode } from '@bruzfin/core';
import { useCallback, useRef, useState } from 'react';
import { useDependencies } from '../../composition/AppProviders';

export type SignInState = {
  /** Um fluxo de login está aberto no navegador ou finalizando. */
  readonly pending: boolean;
  /** Mensagem genérica em pt-BR; `null` quando não há erro (inclusive após cancelar). */
  readonly error: string | null;
  readonly start: (mode: AuthorizationMode) => Promise<void>;
};

/**
 * Dispara o caso de uso `SignIn`. Ao dar certo, a sessão é salva e a guarda de rotas leva ao Início;
 * cancelar (fechar a aba) só volta à tela de entrada, sem erro.
 */
export function useSignIn(): SignInState {
  const { signIn } = useDependencies();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const start = useCallback(
    async (mode: AuthorizationMode) => {
      if (inFlight.current) return; // evita abrir duas abas com toques repetidos
      inFlight.current = true;
      setPending(true);
      setError(null);
      try {
        const result = await signIn.execute({ mode });
        if (!result.ok && result.error.code !== 'auth.cancelled') {
          setError(result.error.message);
        }
      } catch {
        setError('Não foi possível entrar. Tente novamente.');
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [signIn],
  );

  return { pending, error, start };
}

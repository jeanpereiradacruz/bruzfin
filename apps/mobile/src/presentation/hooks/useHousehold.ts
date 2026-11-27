import type { Household, HouseholdError } from '@bruzfin/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDependencies } from '../../composition/AppProviders';

export type HouseholdState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: HouseholdError }
  | { readonly status: 'ready'; readonly household: Household };

/** Carrega o lar ao abrir a tela; `replace` aplica o lar devolvido por renomear ou entrar com código. */
export function useHousehold(): {
  readonly state: HouseholdState;
  readonly reload: () => Promise<void>;
  readonly replace: (household: Household) => void;
} {
  const { household: service } = useDependencies();
  const [state, setState] = useState<HouseholdState>({ status: 'loading' });
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await service.load();
    if (!mounted.current) return;
    setState(
      result.ok
        ? { status: 'ready', household: result.value }
        : { status: 'error', error: result.error },
    );
  }, [service]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const replace = useCallback((household: Household) => {
    setState({ status: 'ready', household });
  }, []);

  return { state, reload, replace };
}

import type { AppLockState } from '@bruzfin/core';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useDependencies } from '../../composition/AppProviders';

/** Estado do bloqueio com biometria/PIN (ligado? bloqueado agora?). */
export function useAppLockState(): AppLockState {
  const { appLock } = useDependencies();
  return useSyncExternalStore(
    (listener) => appLock.subscribe(listener),
    () => appLock.state(),
  );
}

/** Avisa o bloqueio quando o app vai para segundo plano e volta (regra dos 5 minutos). */
export function useAppLockLifecycle(): void {
  const { appLock } = useDependencies();
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') appLock.onBackground();
      else if (state === 'active') appLock.onForeground();
    });
    return () => subscription.remove();
  }, [appLock]);
}

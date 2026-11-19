import {
  AppLock,
  type AuthorizationMode,
  domainError,
  err,
  InMemorySessionStore,
  ok,
  type Result,
  type Session,
  type SignInError,
  type UnlockOutcome,
} from '@bruzfin/core';
import type { AppDependencies } from '../composition/dependencies';

export const testSession: Session = {
  tokens: { accessToken: 'access-token', expiresAt: 1_800_000_000_000 },
  user: {
    id: '019a0000-0000-7000-8000-000000000001',
    email: 'usuario@bruzfin.local',
    name: 'Usuário de Teste',
    household: null,
  },
};

type SignInOutcome = 'success' | 'cancelled' | 'failed';

type FakeOptions = {
  /** Sessão já em memória antes de renderizar. */
  signedIn?: boolean;
  /** Sessão "salva no Keystore": aparece só depois do bootstrap. */
  restoredSession?: boolean;
  /** Bloqueio com biometria/PIN ligado. */
  appLockEnabled?: boolean;
  /** Resultado da biometria/PIN. */
  unlockOutcome?: UnlockOutcome;
  /** Aparelho tem biometria ou PIN configurado. */
  deviceAuthAvailable?: boolean;
};

/** Dependências falsas: login, sessão e bloqueio respondem com o desfecho pedido, sem navegador nem rede. */
export const createFakeDependencies = (
  outcome: SignInOutcome = 'success',
  options: FakeOptions = {},
) => {
  const sessionStore = new InMemorySessionStore();
  if (options.signedIn) sessionStore.save(testSession);

  const execute = jest.fn(
    async ({ mode: _mode }: { mode: AuthorizationMode }): Promise<Result<Session, SignInError>> => {
      if (outcome === 'cancelled') return err(domainError('auth.cancelled', 'Login cancelado.'));
      if (outcome === 'failed') {
        return err(
          domainError(
            'auth.failed',
            'Não foi possível entrar. Verifique sua conexão e tente novamente.',
          ),
        );
      }
      sessionStore.save(testSession);
      return ok(testSession);
    },
  );

  let lockEnabled = options.appLockEnabled ?? false;
  const authenticate = jest.fn(async (_prompt: string) => options.unlockOutcome ?? 'success');
  const appLock = new AppLock(
    {
      isEnabled: async () => lockEnabled,
      setEnabled: async (value) => {
        lockEnabled = value;
      },
    },
    { isAvailable: async () => options.deviceAuthAvailable ?? true, authenticate },
    () => sessionStore.current() !== null,
  );
  sessionStore.subscribe(() => {
    if (sessionStore.current() === null) appLock.release();
  });

  const signOut = jest.fn(async () => {
    sessionStore.clear('signed-out');
  });

  const bootstrap = jest.fn(async () => {
    if (options.restoredSession) sessionStore.save(testSession);
    await appLock.initialize();
  });

  const dependencies: AppDependencies = {
    sessionStore,
    signIn: { execute },
    signOut,
    appLock,
    bootstrap,
  };
  return { dependencies, sessionStore, execute, signOut, appLock, authenticate, bootstrap };
};

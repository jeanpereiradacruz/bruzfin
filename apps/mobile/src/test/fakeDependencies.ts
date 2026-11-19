import {
  type AuthorizationMode,
  domainError,
  err,
  InMemorySessionStore,
  ok,
  type Result,
  type Session,
  type SignInError,
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

/** Dependências falsas: o login responde com o desfecho pedido, sem navegador nem rede. */
export const createFakeDependencies = (
  outcome: SignInOutcome = 'success',
  options: { signedIn?: boolean } = {},
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

  const dependencies: AppDependencies = { sessionStore, signIn: { execute } };
  return { dependencies, sessionStore, execute };
};

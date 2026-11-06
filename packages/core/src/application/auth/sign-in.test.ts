import { describe, expect, it, vi } from 'vitest';
import type { AuthTokens, CurrentUser } from '../../domain/auth/session';
import { domainError } from '../../shared/domain-error';
import { err, ok, type Result } from '../../shared/result';
import { InMemorySessionStore } from './in-memory-session-store';
import type {
  AuthGateway,
  AuthorizationError,
  AuthorizationMode,
  CurrentUserError,
  CurrentUserGateway,
} from './ports';
import { SignIn } from './sign-in';

const tokens: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  idToken: 'id-token',
  expiresAt: 1_800_000_000_000,
};

const user: CurrentUser = {
  id: '019a0000-0000-7000-8000-000000000001',
  email: 'usuario@bruzfin.local',
  name: 'Usuário de Teste',
  household: null,
};

class FakeAuthGateway implements AuthGateway {
  readonly modes: AuthorizationMode[] = [];
  constructor(private readonly result: Result<AuthTokens, AuthorizationError>) {}
  async authorize({ mode }: { mode: AuthorizationMode }) {
    this.modes.push(mode);
    return this.result;
  }
}

class FakeCurrentUserGateway implements CurrentUserGateway {
  readonly tokens: string[] = [];
  constructor(private readonly result: Result<CurrentUser, CurrentUserError>) {}
  async fetchCurrentUser(accessToken: string) {
    this.tokens.push(accessToken);
    return this.result;
  }
}

const setup = (
  authResult: Result<AuthTokens, AuthorizationError> = ok(tokens),
  userResult: Result<CurrentUser, CurrentUserError> = ok(user),
) => {
  const auth = new FakeAuthGateway(authResult);
  const users = new FakeCurrentUserGateway(userResult);
  const sessions = new InMemorySessionStore();
  return { auth, users, sessions, signIn: new SignIn(auth, users, sessions) };
};

describe('SignIn', () => {
  it('autoriza, confirma o perfil na API com o access token e guarda a sessão', async () => {
    const { auth, users, sessions, signIn } = setup();

    const result = await signIn.execute({ mode: 'sign-in' });

    expect(result).toEqual(ok({ tokens, user }));
    expect(auth.modes).toEqual(['sign-in']);
    expect(users.tokens).toEqual(['access-token']);
    expect(sessions.current()).toEqual({ tokens, user });
  });

  it('repassa o modo de cadastro ao provedor', async () => {
    const { auth, signIn } = setup();
    await signIn.execute({ mode: 'sign-up' });
    expect(auth.modes).toEqual(['sign-up']);
  });

  it('cancelado pelo usuário: não busca perfil nem cria sessão', async () => {
    const { users, sessions, signIn } = setup(err(domainError('auth.cancelled', 'cancelado')));

    const result = await signIn.execute({ mode: 'sign-in' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth.cancelled');
    expect(users.tokens).toEqual([]);
    expect(sessions.current()).toBeNull();
  });

  it('falha na autorização vira mensagem genérica em português', async () => {
    const { signIn } = setup(err(domainError('auth.failed', 'invalid_grant: detalhe técnico')));

    const result = await signIn.execute({ mode: 'sign-in' });

    expect(result).toEqual(
      err({
        code: 'auth.failed',
        message: 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
      }),
    );
  });

  it('sem perfil da API não há sessão', async () => {
    const { sessions, signIn } = setup(
      ok(tokens),
      err(domainError('auth.profile-unavailable', 'HTTP 401')),
    );

    const result = await signIn.execute({ mode: 'sign-in' });

    expect(result).toEqual(
      err({
        code: 'auth.profile-unavailable',
        message: 'Não foi possível carregar seu perfil. Tente novamente.',
      }),
    );
    expect(sessions.current()).toBeNull();
  });
});

describe('InMemorySessionStore', () => {
  it('avisa os inscritos quando a sessão muda e permite cancelar a inscrição', () => {
    const store = new InMemorySessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.save({ tokens, user });
    store.clear();
    store.clear(); // já vazia: não avisa de novo
    unsubscribe();
    store.save({ tokens, user });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.current()).toEqual({ tokens, user });
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { AuthTokens, Session } from '../../domain/auth/session';
import { domainError } from '../../shared/domain-error';
import { err, ok, type Result } from '../../shared/result';
import { InMemorySessionStore } from './in-memory-session-store';
import type {
  PendingRevocationQueue,
  TokenGateway,
  TokenRefreshError,
  TokenStorage,
} from './ports';
import { SessionManager } from './session-manager';

const NOW = 1_800_000_000_000;

const tokens = (overrides: Partial<AuthTokens> = {}): AuthTokens => ({
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresAt: NOW + 5 * 60_000,
  ...overrides,
});

const session = (overrides: Partial<AuthTokens> = {}): Session => ({
  tokens: tokens(overrides),
  user: {
    id: '019a0000-0000-7000-8000-000000000001',
    email: 'usuario@bruzfin.local',
    name: 'Usuário de Teste',
    household: null,
  },
});

class FakeStorage implements TokenStorage {
  saved: Session | null = null;
  async load() {
    return this.saved;
  }
  async save(value: Session) {
    this.saved = value;
  }
  async clear() {
    this.saved = null;
  }
}

class FakeQueue implements PendingRevocationQueue {
  items: string[] = [];
  async add(token: string) {
    this.items.push(token);
  }
  async list() {
    return [...this.items];
  }
  async remove(token: string) {
    this.items = this.items.filter((item) => item !== token);
  }
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const renewed = ok<AuthTokens>({
  accessToken: 'access-2',
  refreshToken: 'refresh-2',
  expiresAt: NOW + 10 * 60_000,
});

const setup = (
  options: {
    saved?: Session | null;
    refresh?: (token: string) => Promise<Result<AuthTokens, TokenRefreshError>>;
    endSession?: TokenGateway['endSession'];
  } = {},
) => {
  const storage = new FakeStorage();
  storage.saved = options.saved ?? null;
  const queue = new FakeQueue();
  const sessions = new InMemorySessionStore();
  const gateway = {
    refresh: vi.fn(options.refresh ?? (async () => renewed)),
    endSession: vi.fn(options.endSession ?? (async () => ok(undefined))),
  } satisfies TokenGateway;
  const clock = { now: () => NOW };
  const manager = new SessionManager(gateway, storage, sessions, queue, clock);
  return { manager, storage, queue, sessions, gateway };
};

describe('SessionManager', () => {
  describe('ao reabrir o app', () => {
    it('continua logado com a sessão guardada no armazenamento seguro', async () => {
      const { manager, sessions, gateway } = setup({ saved: session() });
      await manager.restore();
      expect(sessions.current()).toEqual(session());
      expect(gateway.refresh).not.toHaveBeenCalled();
    });

    it('renova sem o usuário perceber se o access token já venceu, e guarda o refresh rotacionado', async () => {
      const { manager, sessions, storage, gateway } = setup({
        saved: session({ expiresAt: NOW - 1 }),
      });
      await manager.restore();
      expect(gateway.refresh).toHaveBeenCalledWith('refresh-1');
      expect(sessions.current()?.tokens.accessToken).toBe('access-2');
      expect(storage.saved?.tokens.refreshToken).toBe('refresh-2');
    });

    it('sem internet, mantém a sessão para tentar de novo depois', async () => {
      const { manager, sessions } = setup({
        saved: session({ expiresAt: NOW - 1 }),
        refresh: async () => err(domainError('auth.offline', 'sem rede')),
      });
      await manager.restore();
      expect(sessions.current()?.tokens.accessToken).toBe('access-1');
    });

    it('refresh recusado volta para a tela de entrada com aviso e apaga os tokens', async () => {
      const { manager, sessions, storage } = setup({
        saved: session({ expiresAt: NOW - 1 }),
        refresh: async () => err(domainError('auth.session-expired', 'expirou')),
      });
      await manager.restore();
      expect(sessions.current()).toBeNull();
      expect(sessions.endReason()).toBe('expired');
      expect(storage.saved).toBeNull();
    });

    it('sem sessão salva, começa deslogado', async () => {
      const { manager, sessions } = setup();
      await manager.restore();
      expect(sessions.current()).toBeNull();
      expect(sessions.endReason()).toBeNull();
    });

    it('armazenamento ilegível começa deslogado, sem quebrar', async () => {
      const { manager, storage, sessions } = setup();
      storage.load = async () => {
        throw new Error('chave do Keystore inválida');
      };
      await manager.restore();
      expect(sessions.current()).toBeNull();
    });
  });

  it('start guarda a sessão nova em memória e no armazenamento seguro', async () => {
    const { manager, sessions, storage } = setup();
    await manager.start(session());
    expect(sessions.current()).toEqual(session());
    expect(storage.saved).toEqual(session());
  });

  describe('access token para as requisições', () => {
    it('devolve o token atual enquanto estiver longe de vencer', async () => {
      const { manager, gateway } = setup();
      await manager.start(session());
      expect(await manager.getAccessToken()).toBe('access-1');
      expect(gateway.refresh).not.toHaveBeenCalled();
    });

    it('renova proativamente quando falta menos de 1 minuto para vencer', async () => {
      const { manager, gateway } = setup();
      await manager.start(session({ expiresAt: NOW + 30_000 }));
      expect(await manager.getAccessToken()).toBe('access-2');
      expect(gateway.refresh).toHaveBeenCalledTimes(1);
    });

    it('várias requisições ao mesmo tempo com token vencido geram uma única renovação', async () => {
      const pending = deferred<Result<AuthTokens, TokenRefreshError>>();
      const { manager, gateway } = setup({ refresh: () => pending.promise });
      await manager.start(session({ expiresAt: NOW - 1 }));

      const requests = Promise.all([
        manager.getAccessToken(),
        manager.getAccessToken(),
        manager.handleUnauthorized('access-1'),
        manager.getAccessToken(),
      ]);
      pending.resolve(renewed);

      expect(await requests).toEqual(['access-2', 'access-2', 'access-2', 'access-2']);
      expect(gateway.refresh).toHaveBeenCalledTimes(1);
    });

    it('após um 401, se outra requisição já renovou, usa o token novo sem renovar de novo', async () => {
      const { manager, gateway } = setup();
      await manager.start(session({ accessToken: 'access-2' }));
      expect(await manager.handleUnauthorized('access-1')).toBe('access-2');
      expect(gateway.refresh).not.toHaveBeenCalled();
    });

    it('após um 401 com o token atual, renova uma vez', async () => {
      const { manager, gateway } = setup();
      await manager.start(session());
      expect(await manager.handleUnauthorized('access-1')).toBe('access-2');
      expect(gateway.refresh).toHaveBeenCalledTimes(1);
    });

    it('uma renovação concluída libera a próxima (não fica presa ao resultado antigo)', async () => {
      let calls = 0;
      const { manager } = setup({
        refresh: async () => {
          calls += 1;
          return ok({ accessToken: `access-${calls + 1}`, expiresAt: NOW - 1 });
        },
      });
      await manager.start(session({ expiresAt: NOW - 1 }));
      expect(await manager.getAccessToken()).toBe('access-2');
      expect(await manager.getAccessToken()).toBe('access-3');
    });

    it('sem provedor devolver refresh novo, mantém o atual', async () => {
      const { manager, sessions } = setup({
        refresh: async () => ok({ accessToken: 'access-2', expiresAt: NOW + 600_000 }),
      });
      await manager.start(session({ expiresAt: NOW - 1 }));
      await manager.getAccessToken();
      expect(sessions.current()?.tokens.refreshToken).toBe('refresh-1');
    });

    it('refresh recusado durante o uso derruba a sessão com aviso', async () => {
      const { manager, sessions } = setup({
        refresh: async () => err(domainError('auth.session-expired', 'expirou')),
      });
      await manager.start(session());
      expect(await manager.handleUnauthorized('access-1')).toBeNull();
      expect(sessions.current()).toBeNull();
      expect(sessions.endReason()).toBe('expired');
    });

    it('sem refresh token, token vencido encerra a sessão', async () => {
      const { manager, sessions } = setup();
      const { refreshToken: _omitted, ...withoutRefresh } = tokens({ expiresAt: NOW - 1 });
      await manager.start({ ...session(), tokens: withoutRefresh });
      expect(await manager.getAccessToken()).toBeNull();
      expect(sessions.endReason()).toBe('expired');
    });

    it('sair durante uma renovação descarta o token novo', async () => {
      const pending = deferred<Result<AuthTokens, TokenRefreshError>>();
      const { manager, sessions, storage } = setup({ refresh: () => pending.promise });
      await manager.start(session({ expiresAt: NOW - 1 }));

      const request = manager.getAccessToken();
      await manager.signOut();
      pending.resolve(renewed);

      expect(await request).toBeNull();
      expect(sessions.current()).toBeNull();
      expect(storage.saved).toBeNull();
    });
  });

  describe('sair', () => {
    it('apaga os tokens do aparelho e encerra a sessão no provedor', async () => {
      const { manager, sessions, storage, gateway, queue } = setup();
      await manager.start(session());
      await manager.signOut();

      expect(sessions.current()).toBeNull();
      expect(sessions.endReason()).toBe('signed-out');
      expect(storage.saved).toBeNull();
      expect(gateway.endSession).toHaveBeenCalledWith('refresh-1');
      expect(queue.items).toEqual([]);
    });

    it('sem internet, apaga localmente e guarda o refresh para revogar depois', async () => {
      const { manager, sessions, storage, queue } = setup({
        endSession: async () => err(domainError('auth.offline', 'sem rede')),
      });
      await manager.start(session());
      await manager.signOut();

      expect(sessions.current()).toBeNull();
      expect(storage.saved).toBeNull();
      expect(queue.items).toEqual(['refresh-1']);
    });

    it('erro inesperado ao revogar também fica na fila', async () => {
      const { manager, queue } = setup({
        endSession: async () => {
          throw new Error('boom');
        },
      });
      await manager.start(session());
      await manager.signOut();
      expect(queue.items).toEqual(['refresh-1']);
    });

    it('a fila de revogação é limitada', async () => {
      const { manager, queue } = setup({
        endSession: async () => err(domainError('auth.offline', 'sem rede')),
      });
      queue.items = ['r1', 'r2', 'r3', 'r4', 'r5'];
      await manager.start(session());
      await manager.signOut();
      expect(queue.items).toEqual(['r2', 'r3', 'r4', 'r5', 'refresh-1']);
    });

    it('a revogação pendente é tentada de novo quando há rede', async () => {
      const { manager, queue, gateway } = setup();
      queue.items = ['refresh-antigo'];
      await manager.flushPendingRevocations();
      expect(gateway.endSession).toHaveBeenCalledWith('refresh-antigo');
      expect(queue.items).toEqual([]);
    });

    it('ainda offline, a revogação pendente continua na fila', async () => {
      const { manager, queue } = setup({
        endSession: async () => err(domainError('auth.offline', 'sem rede')),
      });
      queue.items = ['refresh-antigo'];
      await manager.flushPendingRevocations();
      expect(queue.items).toEqual(['refresh-antigo']);
    });
  });

  describe('ao atualizar o perfil da sessão', () => {
    const household = { id: 'lar-1', name: 'Lar de Usuário', role: 'OWNER' as const };

    it('grava o perfil novo na memória e no armazenamento seguro', async () => {
      const { manager, sessions, storage } = setup();
      await manager.start(session());

      await manager.updateUser((user) => ({ ...user, household }));

      expect(sessions.current()?.user.household).toEqual(household);
      expect(storage.saved?.user.household).toEqual(household);
      expect(storage.saved?.tokens.refreshToken).toBe('refresh-1');
    });

    it('sem sessão, não faz nada', async () => {
      const { manager, sessions, storage } = setup();
      await manager.updateUser((user) => ({ ...user, household }));
      expect(sessions.current()).toBeNull();
      expect(storage.saved).toBeNull();
    });

    it('durante uma renovação, mantém o refresh token rotacionado e o perfil novo', async () => {
      const network = deferred<Result<AuthTokens, TokenRefreshError>>();
      const { manager, sessions, storage } = setup({ refresh: () => network.promise });
      await manager.start(session({ expiresAt: NOW - 1 }));

      const token = manager.getAccessToken();
      const update = manager.updateUser((user) => ({ ...user, household }));
      network.resolve(renewed);
      await Promise.all([token, update]);

      expect(await token).toBe('access-2');
      expect(sessions.current()?.tokens.refreshToken).toBe('refresh-2');
      expect(sessions.current()?.user.household).toEqual(household);
      expect(storage.saved?.tokens.refreshToken).toBe('refresh-2');
      expect(storage.saved?.user.household).toEqual(household);
    });

    it('a troca de perfil que termina antes da renovação não se perde', async () => {
      const network = deferred<Result<AuthTokens, TokenRefreshError>>();
      const { manager, sessions, storage } = setup({ refresh: () => network.promise });
      await manager.start(session({ expiresAt: NOW - 1 }));

      const token = manager.getAccessToken();
      await manager.updateUser((user) => ({ ...user, household }));
      network.resolve(renewed);
      await token;

      expect(sessions.current()?.user.household).toEqual(household);
      expect(storage.saved?.user.household).toEqual(household);
      expect(storage.saved?.tokens.refreshToken).toBe('refresh-2');
    });
  });
});

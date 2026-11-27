import type { Session } from '@bruzfin/core';
import {
  SECURE_KEYS,
  SecureAppLockSettings,
  SecurePendingRevocationQueue,
  type SecureStoreDriver,
  SecureTokenStorage,
} from './secureStorage';

const memoryStore = () => {
  const items = new Map<string, string>();
  const driver: SecureStoreDriver = {
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => {
      items.set(key, value);
    },
    deleteItem: async (key) => {
      items.delete(key);
    },
  };
  return { items, driver };
};

const session: Session = {
  tokens: {
    accessToken: 'access',
    refreshToken: 'refresh',
    idToken: 'id',
    expiresAt: 1_800_000_000_000,
  },
  user: {
    id: '019a0000-0000-7000-8000-000000000001',
    email: 'usuario@bruzfin.local',
    name: null,
    household: { id: '019a0000-0000-7000-8000-000000000002', name: 'Casa' },
  },
};

describe('SecureTokenStorage', () => {
  it('guarda e recupera a sessão', async () => {
    const { driver } = memoryStore();
    const storage = new SecureTokenStorage(driver);
    await storage.save(session);
    expect(await storage.load()).toEqual(session);
  });

  it('sem sessão salva devolve null', async () => {
    expect(await new SecureTokenStorage(memoryStore().driver).load()).toBeNull();
  });

  it('conteúdo corrompido é descartado', async () => {
    const { driver, items } = memoryStore();
    items.set(SECURE_KEYS.session, '{"tokens":');
    expect(await new SecureTokenStorage(driver).load()).toBeNull();
    expect(items.has(SECURE_KEYS.session)).toBe(false);
  });

  it('formato inesperado é descartado', async () => {
    const { driver, items } = memoryStore();
    items.set(SECURE_KEYS.session, JSON.stringify({ tokens: { accessToken: 1 } }));
    expect(await new SecureTokenStorage(driver).load()).toBeNull();
  });

  it('clear apaga a sessão do aparelho', async () => {
    const { driver, items } = memoryStore();
    const storage = new SecureTokenStorage(driver);
    await storage.save(session);
    await storage.clear();
    expect(items.size).toBe(0);
  });
});

describe('SecurePendingRevocationQueue', () => {
  it('acumula sem repetir e remove; vazia, apaga o item', async () => {
    const { driver, items } = memoryStore();
    const queue = new SecurePendingRevocationQueue(driver);
    await queue.add('r1');
    await queue.add('r2');
    await queue.add('r1');
    expect(await queue.list()).toEqual(['r1', 'r2']);
    await queue.remove('r1');
    await queue.remove('r2');
    expect(await queue.list()).toEqual([]);
    expect(items.has(SECURE_KEYS.pendingRevocations)).toBe(false);
  });
});

describe('SecureAppLockSettings', () => {
  it('guarda a preferência de bloqueio', async () => {
    const settings = new SecureAppLockSettings(memoryStore().driver);
    expect(await settings.isEnabled()).toBe(false);
    await settings.setEnabled(true);
    expect(await settings.isEnabled()).toBe(true);
    await settings.setEnabled(false);
    expect(await settings.isEnabled()).toBe(false);
  });
});

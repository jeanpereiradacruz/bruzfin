import type { AppLockSettings, PendingRevocationQueue, Session, TokenStorage } from '@bruzfin/core';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

/**
 * Pontos de contato com o expo-secure-store (no Android: valores cifrados com chave do Keystore),
 * trocáveis nos testes. Nada aqui vai para AsyncStorage nem para logs.
 */
export type SecureStoreDriver = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
};

export const expoSecureStoreDriver: SecureStoreDriver = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

export const SECURE_KEYS = {
  session: 'bruzfin.session.v1',
  pendingRevocations: 'bruzfin.pending-revocations.v1',
  appLock: 'bruzfin.app-lock.v1',
} as const;

const sessionSchema = z.object({
  tokens: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1).optional(),
    idToken: z.string().min(1).optional(),
    expiresAt: z.number(),
  }),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    // Lar ilegível (ex.: salvo antes do papel existir) vira `null`: a tela do lar busca de novo na API.
    household: z
      .object({ id: z.string(), name: z.string(), role: z.enum(['OWNER', 'MEMBER']) })
      .nullable()
      .catch(null),
  }),
});

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

/** Sessão (tokens + perfil) num único item cifrado. */
export class SecureTokenStorage implements TokenStorage {
  constructor(private readonly store: SecureStoreDriver = expoSecureStoreDriver) {}

  async load(): Promise<Session | null> {
    const raw = await this.store.getItem(SECURE_KEYS.session);
    if (!raw) return null;
    const parsed = sessionSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      // Formato antigo ou corrompido: descarta em vez de arriscar uma sessão inválida.
      await this.store.deleteItem(SECURE_KEYS.session);
      return null;
    }
    const { tokens, user } = parsed.data;
    return {
      tokens: {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        ...(tokens.idToken ? { idToken: tokens.idToken } : {}),
      },
      user,
    };
  }

  save(session: Session): Promise<void> {
    return this.store.setItem(SECURE_KEYS.session, JSON.stringify(session));
  }

  clear(): Promise<void> {
    return this.store.deleteItem(SECURE_KEYS.session);
  }
}

const pendingSchema = z.array(z.string().min(1));

/** Refresh tokens a revogar quando houver rede (após um "Sair" offline). */
export class SecurePendingRevocationQueue implements PendingRevocationQueue {
  constructor(private readonly store: SecureStoreDriver = expoSecureStoreDriver) {}

  async list(): Promise<readonly string[]> {
    const raw = await this.store.getItem(SECURE_KEYS.pendingRevocations);
    if (!raw) return [];
    const parsed = pendingSchema.safeParse(parseJson(raw));
    return parsed.success ? parsed.data : [];
  }

  async add(refreshToken: string): Promise<void> {
    const current = await this.list();
    if (current.includes(refreshToken)) return;
    await this.write([...current, refreshToken]);
  }

  async remove(refreshToken: string): Promise<void> {
    const current = await this.list();
    await this.write(current.filter((token) => token !== refreshToken));
  }

  private write(tokens: readonly string[]): Promise<void> {
    return tokens.length === 0
      ? this.store.deleteItem(SECURE_KEYS.pendingRevocations)
      : this.store.setItem(SECURE_KEYS.pendingRevocations, JSON.stringify(tokens));
  }
}

/** Preferência do bloqueio com biometria/PIN (não é segredo, mas fica junto para não abrir outro armazenamento). */
export class SecureAppLockSettings implements AppLockSettings {
  constructor(private readonly store: SecureStoreDriver = expoSecureStoreDriver) {}

  async isEnabled(): Promise<boolean> {
    return (await this.store.getItem(SECURE_KEYS.appLock)) === 'on';
  }

  setEnabled(enabled: boolean): Promise<void> {
    return enabled
      ? this.store.setItem(SECURE_KEYS.appLock, 'on')
      : this.store.deleteItem(SECURE_KEYS.appLock);
  }
}

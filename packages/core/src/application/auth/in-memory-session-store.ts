import type { Session } from '../../domain/auth/session';
import type { SessionStore } from './ports';

/**
 * Sessão só em memória: some quando o app é fechado.
 * Usada no app até o KAN-29 (Keystore) e nos testes.
 */
export class InMemorySessionStore implements SessionStore {
  private session: Session | null = null;
  private readonly listeners = new Set<() => void>();

  current(): Session | null {
    return this.session;
  }

  save(session: Session): void {
    this.session = session;
    this.notify();
  }

  clear(): void {
    if (this.session === null) return;
    this.session = null;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

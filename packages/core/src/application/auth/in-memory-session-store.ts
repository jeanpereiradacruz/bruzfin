import type { Session } from '../../domain/auth/session';
import type { SessionEndReason, SessionStore } from './ports';

/** Sessão observável em memória. A persistência fica no `TokenStorage` (ver `SessionManager`). */
export class InMemorySessionStore implements SessionStore {
  private session: Session | null = null;
  private reason: SessionEndReason | null = null;
  private readonly listeners = new Set<() => void>();

  current(): Session | null {
    return this.session;
  }

  save(session: Session): void {
    this.session = session;
    this.reason = null;
    this.notify();
  }

  clear(reason: SessionEndReason = 'signed-out'): void {
    if (this.session === null) return;
    this.session = null;
    this.reason = reason;
    this.notify();
  }

  endReason(): SessionEndReason | null {
    return this.reason;
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

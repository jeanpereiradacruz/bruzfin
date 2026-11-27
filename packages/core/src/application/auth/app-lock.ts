import { type Clock, systemClock } from './ports';

/** Preferência do usuário (por aparelho): pedir biometria/PIN ao abrir o app. */
export interface AppLockSettings {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
}

/**
 * - `success`: o usuário se identificou;
 * - `cancelled`: fechou o pedido ou errou (pode tentar de novo);
 * - `unavailable`: o aparelho não tem biometria nem PIN/padrão configurado.
 */
export type UnlockOutcome = 'success' | 'cancelled' | 'unavailable';

/** Biometria do aparelho, com alternativa ao PIN/padrão/senha da tela de bloqueio. */
export interface DeviceAuthenticator {
  isAvailable(): Promise<boolean>;
  authenticate(prompt: string): Promise<UnlockOutcome>;
}

export type AppLockState = {
  readonly enabled: boolean;
  readonly locked: boolean;
};

const DEFAULT_GRACE_MS = 5 * 60_000;

/**
 * Bloqueio do app com biometria ou PIN do aparelho (opcional, ligado no Perfil).
 * Bloqueia ao abrir o app com uma sessão salva e ao voltar depois de `graceMs` em segundo plano.
 * Só faz sentido com sessão: sem login não há o que proteger.
 */
export class AppLock {
  private snapshot: AppLockState = { enabled: false, locked: false };
  private backgroundedAt: number | null = null;
  private authenticating: Promise<UnlockOutcome> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly settings: AppLockSettings,
    private readonly authenticator: DeviceAuthenticator,
    private readonly hasSession: () => boolean,
    private readonly clock: Clock = systemClock,
    private readonly graceMs: number = DEFAULT_GRACE_MS,
  ) {}

  /** Ao abrir o app (depois de restaurar a sessão). */
  async initialize(): Promise<void> {
    const enabled = await this.settings.isEnabled().catch(() => false);
    this.update({ enabled, locked: enabled && this.hasSession() });
  }

  state(): AppLockState {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Liga o bloqueio, pedindo a identificação uma vez para confirmar que funciona no aparelho. */
  async enable(): Promise<UnlockOutcome> {
    if (!(await this.authenticator.isAvailable().catch(() => false))) return 'unavailable';
    const outcome = await this.authenticate('Confirme para ativar o bloqueio do BruzFin');
    if (outcome !== 'success') return outcome;
    await this.settings.setEnabled(true);
    this.update({ enabled: true, locked: false });
    return 'success';
  }

  async disable(): Promise<void> {
    await this.settings.setEnabled(false);
    this.update({ enabled: false, locked: false });
  }

  onBackground(): void {
    this.backgroundedAt = this.clock.now();
  }

  onForeground(): void {
    const since = this.backgroundedAt;
    this.backgroundedAt = null;
    if (!this.snapshot.enabled || this.snapshot.locked || since === null) return;
    if (this.hasSession() && this.clock.now() - since >= this.graceMs) {
      this.update({ ...this.snapshot, locked: true });
    }
  }

  async unlock(): Promise<UnlockOutcome> {
    const outcome = await this.authenticate('Desbloquear o BruzFin');
    if (outcome === 'success') this.update({ ...this.snapshot, locked: false });
    return outcome;
  }

  /** Ao sair da conta: nada a proteger até o próximo login. */
  release(): void {
    if (this.snapshot.locked) this.update({ ...this.snapshot, locked: false });
  }

  /** Um pedido por vez: toques repetidos não empilham diálogos de biometria. */
  private authenticate(prompt: string): Promise<UnlockOutcome> {
    if (!this.authenticating) {
      this.authenticating = this.authenticator
        .authenticate(prompt)
        .catch((): UnlockOutcome => 'cancelled')
        .finally(() => {
          this.authenticating = null;
        });
    }
    return this.authenticating;
  }

  private update(next: AppLockState): void {
    if (next.enabled === this.snapshot.enabled && next.locked === this.snapshot.locked) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}

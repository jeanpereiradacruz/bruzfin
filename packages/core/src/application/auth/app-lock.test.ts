import { describe, expect, it, vi } from 'vitest';
import {
  AppLock,
  type AppLockSettings,
  type DeviceAuthenticator,
  type UnlockOutcome,
} from './app-lock';

const GRACE = 5 * 60_000;

const setup = (
  options: {
    enabled?: boolean;
    signedIn?: boolean;
    available?: boolean;
    outcome?: UnlockOutcome;
  } = {},
) => {
  let enabled = options.enabled ?? false;
  let signedIn = options.signedIn ?? true;
  let now = 0;
  const settings: AppLockSettings = {
    isEnabled: async () => enabled,
    setEnabled: async (value) => {
      enabled = value;
    },
  };
  const authenticator = {
    isAvailable: vi.fn(async () => options.available ?? true),
    authenticate: vi.fn(async (_prompt: string) => options.outcome ?? 'success'),
  } satisfies DeviceAuthenticator;
  const lock = new AppLock(settings, authenticator, () => signedIn, { now: () => now }, GRACE);
  return {
    lock,
    authenticator,
    advance: (ms: number) => {
      now += ms;
    },
    setSignedIn: (value: boolean) => {
      signedIn = value;
    },
    isEnabled: () => enabled,
  };
};

describe('AppLock', () => {
  it('desligado (padrão), nunca bloqueia', async () => {
    const { lock, advance } = setup();
    await lock.initialize();
    lock.onBackground();
    advance(GRACE * 10);
    lock.onForeground();
    expect(lock.state()).toEqual({ enabled: false, locked: false });
  });

  it('ligado, bloqueia ao abrir o app com sessão salva', async () => {
    const { lock } = setup({ enabled: true });
    await lock.initialize();
    expect(lock.state().locked).toBe(true);
  });

  it('ligado, não bloqueia ao abrir o app sem sessão', async () => {
    const { lock } = setup({ enabled: true, signedIn: false });
    await lock.initialize();
    expect(lock.state().locked).toBe(false);
  });

  it('bloqueia ao voltar depois de 5 minutos em segundo plano', async () => {
    const { lock, advance } = setup({ enabled: true });
    await lock.initialize();
    await lock.unlock();

    lock.onBackground();
    advance(GRACE);
    lock.onForeground();
    expect(lock.state().locked).toBe(true);
  });

  it('não bloqueia ao voltar antes de 5 minutos', async () => {
    const { lock, advance } = setup({ enabled: true });
    await lock.initialize();
    await lock.unlock();

    lock.onBackground();
    advance(GRACE - 1);
    lock.onForeground();
    expect(lock.state().locked).toBe(false);
  });

  it('não bloqueia ao voltar do login no navegador (ainda sem sessão)', async () => {
    const { lock, advance } = setup({ enabled: true, signedIn: false });
    await lock.initialize();
    lock.onBackground();
    advance(GRACE * 2);
    lock.onForeground();
    expect(lock.state().locked).toBe(false);
  });

  it('desbloqueia com biometria ou PIN do aparelho', async () => {
    const { lock, authenticator } = setup({ enabled: true });
    await lock.initialize();
    expect(await lock.unlock()).toBe('success');
    expect(lock.state().locked).toBe(false);
    expect(authenticator.authenticate).toHaveBeenCalledWith('Desbloquear o BruzFin');
  });

  it('cancelar o pedido mantém bloqueado', async () => {
    const { lock } = setup({ enabled: true, outcome: 'cancelled' });
    await lock.initialize();
    expect(await lock.unlock()).toBe('cancelled');
    expect(lock.state().locked).toBe(true);
  });

  it('toques repetidos em desbloquear abrem um único pedido', async () => {
    const { lock, authenticator } = setup({ enabled: true });
    await lock.initialize();
    await Promise.all([lock.unlock(), lock.unlock(), lock.unlock()]);
    expect(authenticator.authenticate).toHaveBeenCalledTimes(1);
  });

  it('erro do sensor conta como cancelado', async () => {
    const { lock, authenticator } = setup({ enabled: true });
    authenticator.authenticate.mockRejectedValueOnce(new Error('sensor'));
    await lock.initialize();
    expect(await lock.unlock()).toBe('cancelled');
    expect(lock.state().locked).toBe(true);
  });

  it('ligar pede identificação uma vez e guarda a preferência', async () => {
    const { lock, isEnabled } = setup();
    await lock.initialize();
    expect(await lock.enable()).toBe('success');
    expect(lock.state()).toEqual({ enabled: true, locked: false });
    expect(isEnabled()).toBe(true);
  });

  it('ligar sem biometria nem PIN no aparelho é recusado', async () => {
    const { lock, isEnabled, authenticator } = setup({ available: false });
    await lock.initialize();
    expect(await lock.enable()).toBe('unavailable');
    expect(isEnabled()).toBe(false);
    expect(authenticator.authenticate).not.toHaveBeenCalled();
  });

  it('ligar e cancelar a identificação não liga', async () => {
    const { lock, isEnabled } = setup({ outcome: 'cancelled' });
    await lock.initialize();
    expect(await lock.enable()).toBe('cancelled');
    expect(isEnabled()).toBe(false);
  });

  it('desligar libera e guarda a preferência', async () => {
    const { lock, isEnabled } = setup({ enabled: true });
    await lock.initialize();
    await lock.disable();
    expect(lock.state()).toEqual({ enabled: false, locked: false });
    expect(isEnabled()).toBe(false);
  });

  it('ao sair da conta, libera o bloqueio', async () => {
    const { lock } = setup({ enabled: true });
    await lock.initialize();
    lock.release();
    expect(lock.state().locked).toBe(false);
  });

  it('avisa os inscritos quando o estado muda', async () => {
    const { lock } = setup({ enabled: true });
    const listener = vi.fn();
    lock.subscribe(listener);
    await lock.initialize();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

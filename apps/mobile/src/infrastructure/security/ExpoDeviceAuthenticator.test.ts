import { SecurityLevel } from 'expo-local-authentication';
import { ExpoDeviceAuthenticator, type LocalAuthenticationDriver } from './ExpoDeviceAuthenticator';

const driver = (
  level: SecurityLevel,
  result: Awaited<ReturnType<LocalAuthenticationDriver['authenticateAsync']>> = { success: true },
) => ({
  getEnrolledLevelAsync: jest.fn(async () => level),
  authenticateAsync: jest.fn(async () => result),
});

describe('ExpoDeviceAuthenticator', () => {
  it('disponível com biometria ou só com PIN do aparelho', async () => {
    expect(
      await new ExpoDeviceAuthenticator(driver(SecurityLevel.BIOMETRIC_STRONG)).isAvailable(),
    ).toBe(true);
    expect(await new ExpoDeviceAuthenticator(driver(SecurityLevel.SECRET)).isAvailable()).toBe(
      true,
    );
    expect(await new ExpoDeviceAuthenticator(driver(SecurityLevel.NONE)).isAvailable()).toBe(false);
  });

  it('pede biometria com alternativa ao PIN', async () => {
    const fake = driver(SecurityLevel.BIOMETRIC_STRONG);
    expect(await new ExpoDeviceAuthenticator(fake).authenticate('Desbloquear o BruzFin')).toBe(
      'success',
    );
    expect(fake.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Desbloquear o BruzFin',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
  });

  it('cancelar vira cancelled; sem nada configurado vira unavailable', async () => {
    const cancelled = driver(SecurityLevel.SECRET, { success: false, error: 'user_cancel' });
    expect(await new ExpoDeviceAuthenticator(cancelled).authenticate('x')).toBe('cancelled');

    const none = driver(SecurityLevel.NONE);
    expect(await new ExpoDeviceAuthenticator(none).authenticate('x')).toBe('unavailable');
    expect(none.authenticateAsync).not.toHaveBeenCalled();
  });
});

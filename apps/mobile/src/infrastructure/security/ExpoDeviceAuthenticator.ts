import type { DeviceAuthenticator, UnlockOutcome } from '@bruzfin/core';
import * as LocalAuthentication from 'expo-local-authentication';

/** Pontos de contato com o expo-local-authentication, trocáveis nos testes. */
export type LocalAuthenticationDriver = Pick<
  typeof LocalAuthentication,
  'getEnrolledLevelAsync' | 'authenticateAsync'
>;

/**
 * Biometria do aparelho com alternativa ao PIN/padrão/senha da tela de bloqueio
 * (`disableDeviceFallback: false`). Funciona também em aparelhos sem biometria, desde que haja PIN.
 */
export class ExpoDeviceAuthenticator implements DeviceAuthenticator {
  constructor(private readonly driver: LocalAuthenticationDriver = LocalAuthentication) {}

  async isAvailable(): Promise<boolean> {
    const level = await this.driver.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  }

  async authenticate(prompt: string): Promise<UnlockOutcome> {
    if (!(await this.isAvailable())) return 'unavailable';
    const result = await this.driver.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (result.success) return 'success';
    return result.error === 'not_enrolled' || result.error === 'passcode_not_set'
      ? 'unavailable'
      : 'cancelled';
  }
}

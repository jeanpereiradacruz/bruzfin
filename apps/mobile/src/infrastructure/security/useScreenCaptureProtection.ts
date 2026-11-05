import { usePreventScreenCapture } from 'expo-screen-capture';

/**
 * Exceção só para desenvolvimento (prints em testes visuais e depuração):
 * exige um build de desenvolvimento E a variável EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE=1.
 * Em builds de produção `__DEV__` é false e a proteção fica sempre ligada.
 */
const allowCaptureInDev = __DEV__ && process.env.EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE === '1';

function useProtection(): void {
  usePreventScreenCapture('bruzfin-app');
}

function useNoProtection(): void {}

/**
 * Liga o FLAG_SECURE do Android: bloqueia prints, gravação de tela e a prévia do app
 * na lista de apps recentes, já que as telas mostram dados financeiros.
 */
export const useScreenCaptureProtection: () => void = allowCaptureInDev
  ? useNoProtection
  : useProtection;

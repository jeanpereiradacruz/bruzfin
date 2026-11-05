import { usePreventScreenCapture } from 'expo-screen-capture';

/**
 * Liga o FLAG_SECURE do Android: bloqueia prints, gravação de tela e a prévia do app
 * na lista de apps recentes, já que as telas mostram dados financeiros.
 */
export function useScreenCaptureProtection(): void {
  usePreventScreenCapture('bruzfin-app');
}

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useUnistyles } from 'react-native-unistyles';
import { AppProviders } from '../composition/AppProviders';
import { useScreenCaptureProtection } from '../infrastructure/security/useScreenCaptureProtection';
import { useAppLockLifecycle, useAppLockState } from '../presentation/hooks/useAppLock';
import { useBootstrap } from '../presentation/hooks/useBootstrap';
import { useSession } from '../presentation/hooks/useSession';
import { LockScreen } from '../presentation/screens/LockScreen';
import { fontAssets } from '../presentation/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  // A splash já pode ter sido escondida (ex.: recarregamento em desenvolvimento).
});

export default function RootLayout() {
  useScreenCaptureProtection();
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}

/** Mantém a splash até as fontes carregarem e a sessão ser restaurada do Keystore. */
function AppShell() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const sessionReady = useBootstrap();
  const { theme } = useUnistyles();
  const ready = (fontsLoaded || fontError !== null) && sessionReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      <AppLockGate />
    </>
  );
}

/** Guarda de rotas: sem sessão só a tela de entrada existe; com sessão, as abas e os modais. */
function RootNavigator() {
  const { theme } = useUnistyles();
  const signedIn = useSession() !== null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surface100 },
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="nova-compra" options={{ presentation: 'modal' }} />
        <Stack.Screen name="configuracoes" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="entrar" />
      </Stack.Protected>
    </Stack>
  );
}

/** Tela de bloqueio (biometria/PIN) sobre todo o conteúdo, quando ligada no Perfil. */
function AppLockGate() {
  useAppLockLifecycle();
  const signedIn = useSession() !== null;
  const { locked } = useAppLockState();
  return signedIn && locked ? <LockScreen /> : null;
}

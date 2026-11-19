import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useUnistyles } from 'react-native-unistyles';
import { AppProviders } from '../composition/AppProviders';
import { useScreenCaptureProtection } from '../infrastructure/security/useScreenCaptureProtection';
import { useSession } from '../presentation/hooks/useSession';
import { fontAssets } from '../presentation/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  // A splash já pode ter sido escondida (ex.: recarregamento em desenvolvimento).
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { theme } = useUnistyles();
  useScreenCaptureProtection();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProviders>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </AppProviders>
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
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="entrar" />
      </Stack.Protected>
    </Stack>
  );
}

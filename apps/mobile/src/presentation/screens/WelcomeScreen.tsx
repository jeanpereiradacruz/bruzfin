import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BrandLogo } from '../components/BrandLogo';
import { useSignIn } from '../hooks/useSignIn';

/**
 * Tela de entrada (sem sessão). O formulário de email e senha fica na página do BruzFin no
 * Keycloak (aberta no navegador seguro do sistema); o app nunca recebe a senha.
 */
export function WelcomeScreen() {
  const { pending, error, start } = useSignIn();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <BrandLogo />
        <Text style={styles.brandName} accessible={false} importantForAccessibility="no">
          BruzFin
        </Text>
        <Text style={styles.tagline}>Seu dinheiro, com clareza.</Text>
      </View>

      <View style={styles.actions}>
        <Text accessibilityRole="header" style={styles.heading}>
          Entrar na sua conta
        </Text>

        {error ? (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          testID="welcome-sign-in"
          accessibilityRole="button"
          accessibilityLabel="Entrar"
          accessibilityState={{ disabled: pending, busy: pending }}
          disabled={pending}
          onPress={() => start('sign-in')}
          style={({ pressed }) => [styles.primary, (pressed || pending) && styles.dimmed]}
        >
          {pending ? (
            <ActivityIndicator color={theme.colors.onBrand} accessibilityLabel="Entrando" />
          ) : (
            <Text style={styles.primaryLabel}>Entrar</Text>
          )}
        </Pressable>

        <Pressable
          testID="welcome-sign-up"
          accessibilityRole="button"
          accessibilityLabel="Criar conta"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={() => start('sign-up')}
          style={({ pressed }) => [styles.secondary, (pressed || pending) && styles.dimmed]}
        >
          <Text style={styles.secondaryLabel}>Criar conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface100,
    paddingTop: rt.insets.top + 40,
    paddingBottom: rt.insets.bottom + theme.spacing[6],
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[6],
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  brandName: {
    fontFamily: theme.font('display', 700),
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.96,
    color: theme.colors.ink,
  },
  tagline: {
    ...theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.inkMuted,
  },
  actions: {
    gap: theme.spacing[4],
  },
  heading: {
    fontFamily: theme.font('display', 700),
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    color: theme.colors.ink,
  },
  error: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.negative,
  },
  primary: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: theme.font('sans', 600),
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.onBrand,
  },
  secondary: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.inkMuted,
    backgroundColor: theme.colors.surface000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: theme.font('sans', 600),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  dimmed: {
    opacity: 0.7,
  },
}));

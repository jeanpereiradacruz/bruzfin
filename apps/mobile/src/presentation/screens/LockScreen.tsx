import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useDependencies } from '../../composition/AppProviders';
import { BrandLogo } from '../components/BrandLogo';
import { useSignOut } from '../hooks/useSignOut';

/**
 * Tela de bloqueio sobre o conteúdo (o FLAG_SECURE já esconde a prévia nos apps recentes).
 * Pede a biometria assim que aparece; se o usuário cancelar, fica o botão para tentar de novo.
 */
export function LockScreen() {
  const { appLock } = useDependencies();
  const { pending: signingOut, signOut } = useSignOut();
  const [message, setMessage] = useState<string | null>(null);
  const prompted = useRef(false);

  const unlock = useCallback(async () => {
    setMessage(null);
    const outcome = await appLock.unlock();
    if (outcome === 'unavailable') {
      setMessage('Não há biometria nem PIN configurados no aparelho. Saia e entre de novo.');
    }
  }, [appLock]);

  useEffect(() => {
    if (prompted.current) return;
    prompted.current = true;
    void unlock();
  }, [unlock]);

  return (
    <View style={styles.container} accessibilityViewIsModal>
      <View style={styles.brand}>
        <BrandLogo />
        <Text accessibilityRole="header" style={styles.heading}>
          BruzFin bloqueado
        </Text>
        <Text style={styles.text}>Use a biometria ou o PIN do aparelho para continuar.</Text>
        {message ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {message}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          testID="lock-unlock"
          accessibilityRole="button"
          onPress={() => void unlock()}
          style={({ pressed }) => [styles.primary, pressed && styles.dimmed]}
        >
          <Text style={styles.primaryLabel}>Desbloquear</Text>
        </Pressable>
        <Pressable
          testID="lock-sign-out"
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          disabled={signingOut}
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.secondary, (pressed || signingOut) && styles.dimmed]}
        >
          <Text style={styles.secondaryLabel}>Sair da conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  heading: {
    fontFamily: theme.font('display', 700),
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    color: theme.colors.ink,
  },
  text: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.inkMuted,
  },
  error: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.negative,
  },
  actions: {
    gap: theme.spacing[4],
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

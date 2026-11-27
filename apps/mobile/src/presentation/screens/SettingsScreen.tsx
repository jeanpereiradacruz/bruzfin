import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useDependencies } from '../../composition/AppProviders';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/icons';
import { useAppLockState } from '../hooks/useAppLock';
import { useSession } from '../hooks/useSession';
import { useSignOut } from '../hooks/useSignOut';

/**
 * Configurações (design App-Perfil). Por enquanto: lar, bloqueio com biometria/PIN e "Sair";
 * os demais itens do design (alterar email/senha, Google, tema, dados) chegam nos próximos tickets.
 */
export function SettingsScreen() {
  const router = useRouter();
  const session = useSession();
  const { theme } = useUnistyles();
  const { appLock } = useDependencies();
  const { enabled } = useAppLockState();
  const { pending: signingOut, signOut } = useSignOut();
  const [lockBusy, setLockBusy] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const toggleLock = async (next: boolean) => {
    if (lockBusy) return;
    setLockBusy(true);
    setLockMessage(null);
    try {
      if (!next) {
        await appLock.disable();
        return;
      }
      const outcome = await appLock.enable();
      if (outcome === 'unavailable') {
        setLockMessage('Configure uma biometria ou um PIN no aparelho para usar o bloqueio.');
      }
    } catch {
      setLockMessage('Não foi possível alterar o bloqueio. Tente novamente.');
    } finally {
      setLockBusy(false);
    }
  };

  const email = session?.user.email ?? '';
  const householdName = session?.user.household?.name ?? 'Seu lar';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          testID="settings-back"
          accessibilityRole="button"
          accessibilityLabel="Voltar para Início"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Icon name="back" color={theme.colors.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Configurações
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profile}>
          <Avatar label={session?.user.name ?? email} size={52} />
          <View style={styles.profileText}>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <Text style={styles.muted}>Entrou com email e senha</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Lar
          </Text>
          <View style={styles.card}>
            <Pressable
              testID="settings-household"
              accessibilityRole="button"
              accessibilityLabel={`Lar: ${householdName}`}
              accessibilityHint="Membros, código de convite e entrar em outro lar"
              onPress={() => router.push('/lar')}
              style={({ pressed }) => [styles.row, pressed && styles.dimmed]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {householdName}
                </Text>
                <Text style={styles.muted}>Membros e convites</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Segurança
          </Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel} nativeID="lock-label">
                  Bloquear com biometria ou PIN
                </Text>
                <Text style={styles.muted}>
                  Ao abrir o app e ao voltar depois de 5 minutos fora dele.
                </Text>
              </View>
              <Switch
                testID="settings-app-lock"
                accessibilityLabel="Bloquear com biometria ou PIN"
                accessibilityLabelledBy="lock-label"
                value={enabled}
                disabled={lockBusy}
                onValueChange={(next) => void toggleLock(next)}
                trackColor={{ false: theme.colors.border, true: theme.colors.brand600 }}
                thumbColor={theme.colors.surface000}
              />
            </View>
          </View>
          {lockMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {lockMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Seus dados
          </Text>
          <View style={styles.card}>
            <Pressable
              testID="settings-sign-out"
              accessibilityRole="button"
              accessibilityLabel="Sair"
              accessibilityState={{ disabled: signingOut, busy: signingOut }}
              disabled={signingOut}
              onPress={() => void signOut()}
              style={({ pressed }) => [styles.row, pressed && styles.dimmed]}
            >
              <Text style={styles.signOut}>Sair</Text>
              {signingOut ? <ActivityIndicator color={theme.colors.inkMuted} /> : null}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface100,
    paddingTop: rt.insets.top,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingTop: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.font('display', 700),
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.ink,
  },
  content: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    gap: 20,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileText: {
    flex: 1,
  },
  email: {
    fontFamily: theme.font('sans', 600),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  muted: {
    fontFamily: theme.font('sans', 400),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.inkMuted,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    fontFamily: theme.font('sans', 600),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.inkMuted,
  },
  card: {
    backgroundColor: theme.colors.surface000,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
  },
  row: {
    minHeight: 52,
    paddingVertical: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: theme.font('sans', 400),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  chevron: {
    fontFamily: theme.font('sans', 400),
    fontSize: 20,
    lineHeight: 22,
    color: theme.colors.inkMuted,
  },
  signOut: {
    fontFamily: theme.font('sans', 600),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  error: {
    paddingHorizontal: 4,
    fontFamily: theme.font('sans', 400),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.negative,
  },
  dimmed: {
    opacity: 0.7,
  },
}));

import {
  HOUSEHOLD_NAME_MAX_LENGTH,
  type Household,
  type HouseholdInvite,
  type HouseholdMember,
} from '@bruzfin/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useDependencies } from '../../composition/AppProviders';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/icons';
import { useHousehold } from '../hooks/useHousehold';
import { useSession } from '../hooks/useSession';

const expiryFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** "29/11 às 14:30" */
export const formatInviteExpiry = (expiresAt: number): string => {
  const parts = expiryFormat.formatToParts(new Date(expiresAt));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')}/${part('month')} às ${part('hour')}:${part('minute')}`;
};

export const inviteShareMessage = (householdName: string, invite: HouseholdInvite): string =>
  `Entre no lar "${householdName}" no BruzFin com o código ${invite.code}. ` +
  `Vale até ${formatInviteExpiry(invite.expiresAt)} e só pode ser usado uma vez.`;

/**
 * Lar (a partir das Configurações): nome, membros, código de convite e entrada em outro lar.
 * Cada membro continua com o próprio login; o lar é o monitoramento de conta compartilhado.
 */
export function HouseholdScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { state, reload, replace } = useHousehold();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          testID="household-back"
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Icon name="back" color={theme.colors.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Lar
        </Text>
      </View>

      {state.status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand600} accessibilityLabel="Carregando o lar" />
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View style={styles.centered}>
          <Text accessibilityRole="alert" style={styles.body}>
            {state.error.message}
          </Text>
          <Pressable
            testID="household-retry"
            accessibilityRole="button"
            onPress={() => void reload()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.dimmed]}
          >
            <Text style={styles.secondaryLabel}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === 'ready' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Outro lar (entrou com código): campos e código gerado recomeçam do zero. */}
          <NameSection
            key={`name-${state.household.id}`}
            household={state.household}
            onSaved={replace}
          />
          <MembersSection household={state.household} />
          <InviteSection key={`invite-${state.household.id}`} household={state.household} />
          {state.household.members.length === 1 ? <JoinSection onJoined={replace} /> : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function NameSection({
  household,
  onSaved,
}: {
  readonly household: Household;
  readonly onSaved: (household: Household) => void;
}) {
  const { theme } = useUnistyles();
  const { household: service } = useDependencies();
  const [name, setName] = useState(household.name);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const changed = name.trim().replace(/\s+/g, ' ') !== household.name;

  const save = async () => {
    if (busy || !changed) return;
    setBusy(true);
    setFeedback(null);
    const result = await service.rename(name);
    setBusy(false);
    if (result.ok) {
      setName(result.value.name);
      setFeedback({ kind: 'ok', text: 'Nome salvo.' });
      onSaved(result.value);
    } else {
      setFeedback({ kind: 'error', text: result.error.message });
    }
  };

  return (
    <View style={styles.section}>
      <Text nativeID="household-name-label" style={styles.sectionTitle}>
        Nome do lar
      </Text>
      <View style={[styles.card, styles.row]}>
        <TextInput
          testID="household-name"
          accessibilityLabel="Nome do lar"
          accessibilityLabelledBy="household-name-label"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setFeedback(null);
          }}
          maxLength={HOUSEHOLD_NAME_MAX_LENGTH}
          returnKeyType="done"
          onSubmitEditing={() => void save()}
          style={styles.input}
          placeholderTextColor={theme.colors.inkMuted}
        />
        <Pressable
          testID="household-rename"
          accessibilityRole="button"
          // Rótulo explícito: no Android, o rótulo tirado do texto não volta depois do estado "busy".
          accessibilityLabel="Salvar nome do lar"
          accessibilityState={{ disabled: !changed || busy, busy }}
          disabled={!changed || busy}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.inlineButton,
            (!changed || busy) && styles.disabled,
            pressed && styles.dimmed,
          ]}
        >
          <Text style={styles.inlineButtonLabel}>Salvar</Text>
        </Pressable>
      </View>
      {feedback ? (
        <Text
          accessibilityRole={feedback.kind === 'error' ? 'alert' : 'text'}
          accessibilityLiveRegion="polite"
          style={feedback.kind === 'error' ? styles.error : styles.success}
        >
          {feedback.text}
        </Text>
      ) : null}
    </View>
  );
}

function MembersSection({ household }: { readonly household: Household }) {
  const myId = useSession()?.user.id;
  const count = household.members.length;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {count === 1 ? 'Membros (1)' : `Membros (${count})`}
      </Text>
      <View style={styles.card}>
        {household.members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            isMe={member.id === myId}
            last={index === count - 1}
          />
        ))}
      </View>
    </View>
  );
}

function MemberRow({
  member,
  isMe,
  last,
}: {
  readonly member: HouseholdMember;
  readonly isMe: boolean;
  readonly last: boolean;
}) {
  const display = member.name ?? member.email;
  const role = member.role === 'OWNER' ? 'Criou o lar' : 'Membro';
  return (
    <View
      style={[styles.memberRow, !last && styles.divider]}
      accessible
      accessibilityLabel={`${display}${isMe ? ', você' : ''}, ${role}, ${member.email}`}
    >
      <Avatar label={display} size={36} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {display}
          {isMe ? <Text style={styles.muted}> (você)</Text> : null}
        </Text>
        <Text style={styles.muted} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <Text style={styles.roleTag}>{role}</Text>
    </View>
  );
}

function InviteSection({ household }: { readonly household: Household }) {
  const { theme } = useUnistyles();
  const { household: service } = useDependencies();
  const [invite, setInvite] = useState<HouseholdInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await service.createInvite();
    setBusy(false);
    if (result.ok) setInvite(result.value);
    else setError(result.error.message);
  };

  const share = () => {
    if (!invite) return;
    Share.share({ message: inviteShareMessage(household.name, invite) }).catch(() => {});
  };

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Convidar
      </Text>
      <View style={[styles.card, styles.cardPadded]}>
        <Text style={styles.body}>
          Gere um código para outra pessoa entrar no seu lar. Cada um continua com o próprio login.
        </Text>
        {invite ? (
          <View style={styles.invite}>
            <Text
              testID="household-invite-code"
              selectable
              accessibilityLabel={`Código de convite ${invite.code.split('').join(' ')}`}
              style={styles.code}
            >
              {invite.code}
            </Text>
            <Text style={styles.muted}>
              Vale até {formatInviteExpiry(invite.expiresAt)} e só pode ser usado uma vez.
            </Text>
            <Pressable
              testID="household-share"
              accessibilityRole="button"
              onPress={share}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.dimmed]}
            >
              <Text style={styles.primaryLabel}>Compartilhar</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          testID="household-invite"
          accessibilityRole="button"
          accessibilityLabel={invite ? 'Gerar outro código' : 'Gerar código de convite'}
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={() => void generate()}
          style={({ pressed }) => [
            invite ? styles.secondaryButton : styles.primaryButton,
            (pressed || busy) && styles.dimmed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={invite ? theme.colors.ink : theme.colors.onBrand} />
          ) : (
            <Text style={invite ? styles.secondaryLabel : styles.primaryLabel}>
              {invite ? 'Gerar outro código' : 'Gerar código de convite'}
            </Text>
          )}
        </Pressable>
        {invite ? (
          <Text style={styles.muted}>Um código novo faz o anterior deixar de valer.</Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function JoinSection({ onJoined }: { readonly onJoined: (household: Household) => void }) {
  const { theme } = useUnistyles();
  const { household: service } = useDependencies();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    if (busy || code.trim() === '') return;
    setBusy(true);
    setError(null);
    const result = await service.acceptInvite(code);
    setBusy(false);
    if (result.ok) onJoined(result.value);
    else setError(result.error.message);
  };

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Entrar em outro lar
      </Text>
      <View style={[styles.card, styles.cardPadded]}>
        <Text nativeID="household-code-label" style={styles.body}>
          Recebeu um código de convite? Digite aqui. Seu lar atual, ainda vazio, deixa de existir.
        </Text>
        <TextInput
          testID="household-code"
          accessibilityLabel="Código de convite"
          accessibilityLabelledBy="household-code-label"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setError(null);
          }}
          placeholder="Ex.: ABCD-1234"
          placeholderTextColor={theme.colors.inkMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={12}
          returnKeyType="go"
          onSubmitEditing={() => void join()}
          style={[styles.input, styles.codeInput]}
        />
        <Pressable
          testID="household-accept"
          accessibilityRole="button"
          accessibilityLabel="Entrar no lar"
          accessibilityState={{ disabled: busy || code.trim() === '', busy }}
          disabled={busy || code.trim() === ''}
          onPress={() => void join()}
          style={({ pressed }) => [
            styles.primaryButton,
            code.trim() === '' && styles.disabled,
            (pressed || busy) && styles.dimmed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.onBrand} />
          ) : (
            <Text style={styles.primaryLabel}>Entrar no lar</Text>
          )}
        </Pressable>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
    paddingHorizontal: theme.spacing[6],
  },
  content: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: rt.insets.bottom + theme.spacing[6],
    gap: 20,
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
  cardPadded: {
    paddingVertical: 14,
    gap: 12,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberRow: {
    minHeight: 60,
    paddingVertical: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: theme.font('sans', 600),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
  },
  roleTag: {
    fontFamily: theme.font('sans', 500),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.inkMuted,
  },
  body: {
    fontFamily: theme.font('sans', 400),
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
  input: {
    flex: 1,
    minHeight: 44,
    fontFamily: theme.font('sans', 400),
    fontSize: 15,
    color: theme.colors.ink,
  },
  codeInput: {
    flex: 0,
    borderWidth: 1,
    borderColor: theme.colors.inkMuted,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    fontFamily: theme.font('display', 700),
    fontSize: 18,
    letterSpacing: 2,
  },
  invite: {
    gap: 8,
  },
  code: {
    fontFamily: theme.font('display', 700),
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
    color: theme.colors.ink,
    textAlign: 'center',
  },
  inlineButton: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonLabel: {
    fontFamily: theme.font('sans', 600),
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onBrand,
  },
  primaryButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: theme.font('sans', 600),
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.onBrand,
  },
  secondaryButton: {
    height: 48,
    paddingHorizontal: theme.spacing[4],
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
  success: {
    paddingHorizontal: 4,
    fontFamily: theme.font('sans', 400),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.positive,
  },
  error: {
    paddingHorizontal: 4,
    fontFamily: theme.font('sans', 400),
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.negative,
  },
  disabled: {
    opacity: 0.5,
  },
  dimmed: {
    opacity: 0.7,
  },
}));

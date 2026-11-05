import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { Icon } from '../components/icons';

export function NewTransactionScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Icon name="close" color={theme.colors.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Nova compra
        </Text>
      </View>
      <View style={styles.content}>
        <ComingSoonCard description="Valor, estabelecimento, categoria, conta, data e tags." />
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
  closeButton: {
    width: theme.minTouchTarget,
    height: theme.minTouchTarget,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.heading2,
    fontFamily: theme.font('display', 700),
    color: theme.colors.ink,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing[4],
  },
}));

import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ComingSoonCardProps = {
  readonly description: string;
};

/** Cartão provisório para as telas que ainda serão implementadas. */
export function ComingSoonCard({ description }: ComingSoonCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Em construção</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface000,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    gap: theme.spacing[1],
  },
  title: {
    ...theme.typography.heading2,
    color: theme.colors.ink,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.inkMuted,
  },
}));

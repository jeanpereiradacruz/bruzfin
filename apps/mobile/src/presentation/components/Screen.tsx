import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ScreenProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly children?: ReactNode;
};

/** Estrutura base das telas: cabeçalho com título (heading-1) e conteúdo com gutter de 16px. */
export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
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
    paddingTop: 20,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[2],
    gap: 2,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.inkMuted,
  },
  title: {
    ...theme.typography.heading1,
    color: theme.colors.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    gap: theme.spacing[4],
  },
}));

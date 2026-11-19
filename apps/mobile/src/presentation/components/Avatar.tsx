import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type AvatarProps = {
  /** Nome ou email: usa a primeira letra. */
  readonly label: string;
  readonly size?: number;
};

/** Círculo brand-100 com a inicial do usuário (design: Início e Configurações). Decorativo. */
export function Avatar({ label, size = 44 }: AvatarProps) {
  const initial = label.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.37) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  circle: {
    backgroundColor: theme.colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: theme.font('display', 700),
    color: theme.colors.brand600,
  },
}));

import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName } from './icons';

export type TabKey = 'inicio' | 'contas' | 'graficos' | 'cadastros';

type TabItem = { readonly key: TabKey; readonly label: string; readonly icon: IconName };

export const tabItems: readonly TabItem[] = [
  { key: 'inicio', label: 'Início', icon: 'home' },
  { key: 'contas', label: 'Contas', icon: 'accounts' },
  { key: 'graficos', label: 'Gráficos', icon: 'charts' },
  { key: 'cadastros', label: 'Cadastros', icon: 'registry' },
];

type TabBarProps = {
  readonly activeKey: TabKey;
  readonly onSelect: (key: TabKey) => void;
  readonly onCreate: () => void;
};

/**
 * Barra de navegação inferior do design "App · Início":
 * quatro abas e o botão central verde de nova compra.
 */
export function TabBar({ activeKey, onSelect, onCreate }: TabBarProps) {
  const { theme } = useUnistyles();
  const [first, second, third, fourth] = tabItems;

  const renderTab = (item: TabItem | undefined) => {
    if (!item) return null;
    const active = item.key === activeKey;
    const color = active ? theme.colors.brand600 : theme.colors.inkMuted;
    return (
      <Pressable
        key={item.key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(item.key)}
        style={styles.tab}
        testID={`tab-${item.key}`}
      >
        <Icon name={item.icon} color={color} />
        <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {renderTab(first)}
      {renderTab(second)}
      <View style={styles.centerSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova compra"
          onPress={onCreate}
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          testID="tab-nova-compra"
        >
          <Icon name="plus" color={theme.colors.onBrand} size={24} strokeWidth={2} />
        </Pressable>
      </View>
      {renderTab(third)}
      {renderTab(fourth)}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    paddingBottom: Math.max(rt.insets.bottom, 20),
    backgroundColor: theme.colors.surface000,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    minHeight: theme.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  labelActive: {
    color: theme.colors.brand600,
    fontFamily: theme.font('sans', 600),
  },
  labelInactive: {
    color: theme.colors.inkMuted,
    fontFamily: theme.font('sans', 500),
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonPressed: {
    opacity: 0.85,
  },
}));

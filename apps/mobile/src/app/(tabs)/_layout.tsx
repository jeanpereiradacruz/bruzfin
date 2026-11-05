import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { TabBar, type TabKey } from '../../presentation/components/TabBar';

type TabBarRenderProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Nome da rota (arquivo em app/(tabs)) de cada aba. */
const routeByTab: Record<TabKey, string> = {
  inicio: 'index',
  contas: 'contas',
  graficos: 'graficos',
  cadastros: 'cadastros',
};

const tabByRoute = Object.fromEntries(
  Object.entries(routeByTab).map(([tab, route]) => [route, tab as TabKey]),
) as Record<string, TabKey>;

function RouterTabBar({ state, navigateToTab }: TabBarRenderProps) {
  const router = useRouter();
  const currentRoute = state.routes[state.index]?.name ?? 'index';

  const selectTab = (key: TabKey) => {
    const route = state.routes.find((candidate) => candidate.name === routeByTab[key]);
    if (route) navigateToTab(route.key);
  };

  return (
    <TabBar
      activeKey={tabByRoute[currentRoute] ?? 'inicio'}
      onSelect={selectTab}
      onCreate={() => router.push('/nova-compra')}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RouterTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="contas" options={{ title: 'Contas' }} />
      <Tabs.Screen name="graficos" options={{ title: 'Gráficos' }} />
      <Tabs.Screen name="cadastros" options={{ title: 'Cadastros' }} />
    </Tabs>
  );
}

import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Avatar } from '../components/Avatar';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { Screen } from '../components/Screen';
import { useSession } from '../hooks/useSession';

export function HomeScreen() {
  const session = useSession();
  const router = useRouter();
  const firstName = session?.user.name?.trim().split(/\s+/)[0];

  return (
    <Screen
      title="Início"
      {...(firstName ? { subtitle: `Olá, ${firstName}` } : {})}
      headerRight={
        <Pressable
          testID="home-settings"
          accessibilityRole="button"
          accessibilityLabel="Configurações"
          hitSlop={4}
          onPress={() => router.push('/configuracoes')}
        >
          <Avatar label={session?.user.name ?? session?.user.email ?? ''} />
        </Pressable>
      }
    >
      <ComingSoonCard description="Saldo do mês, gastos por categoria e últimos lançamentos." />
    </Screen>
  );
}

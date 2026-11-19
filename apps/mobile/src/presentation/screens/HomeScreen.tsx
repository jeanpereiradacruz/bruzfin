import { ComingSoonCard } from '../components/ComingSoonCard';
import { Screen } from '../components/Screen';
import { useSession } from '../hooks/useSession';

export function HomeScreen() {
  const session = useSession();
  const firstName = session?.user.name?.trim().split(/\s+/)[0];

  return (
    <Screen title="Início" {...(firstName ? { subtitle: `Olá, ${firstName}` } : {})}>
      <ComingSoonCard description="Saldo do mês, gastos por categoria e últimos lançamentos." />
    </Screen>
  );
}

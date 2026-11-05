import { ComingSoonCard } from '../components/ComingSoonCard';
import { Screen } from '../components/Screen';

export function HomeScreen() {
  return (
    <Screen title="Início">
      <ComingSoonCard description="Saldo do mês, gastos por categoria e últimos lançamentos." />
    </Screen>
  );
}

import { colors } from '@bruzfin/design-tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TabBar, type TabKey } from './TabBar';

const renderTabBar = async (activeKey: TabKey = 'inicio') => {
  const onSelect = jest.fn();
  const onCreate = jest.fn();
  await render(<TabBar activeKey={activeKey} onSelect={onSelect} onCreate={onCreate} />);
  return { onSelect, onCreate };
};

describe('TabBar', () => {
  it('mostra as quatro abas do design, na ordem', async () => {
    await renderTabBar();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Início',
      'Contas',
      'Gráficos',
      'Cadastros',
    ]);
  });

  it('marca só a aba ativa como selecionada', async () => {
    await renderTabBar('graficos');
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Início' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Contas' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Cadastros' })).not.toBeSelected();
  });

  it('pinta o rótulo da aba ativa em brand-600 e as demais em ink-muted', async () => {
    await renderTabBar('contas');
    expect(screen.getByText('Contas')).toHaveStyle({ color: colors.light.brand600 });
    expect(screen.getByText('Início')).toHaveStyle({ color: colors.light.inkMuted });
  });

  it('navega ao tocar em uma aba', async () => {
    const { onSelect } = await renderTabBar();
    await fireEvent.press(screen.getByRole('tab', { name: 'Cadastros' }));
    expect(onSelect).toHaveBeenCalledWith('cadastros');
  });

  it('abre a nova compra pelo botão central', async () => {
    const { onCreate, onSelect } = await renderTabBar();
    await fireEvent.press(screen.getByRole('button', { name: 'Nova compra' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('botão central é verde (brand-600) com 52px', async () => {
    await renderTabBar();
    expect(screen.getByTestId('tab-nova-compra')).toHaveStyle({
      width: 52,
      height: 52,
      backgroundColor: colors.light.brand600,
    });
  });

  it('abas têm área de toque mínima de 44px', async () => {
    await renderTabBar();
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveStyle({ minHeight: 44 });
    }
  });
});

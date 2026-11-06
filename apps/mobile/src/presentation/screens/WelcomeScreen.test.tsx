import { colors } from '@bruzfin/design-tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '../../composition/AppProviders';
import { createFakeDependencies } from '../../test/fakeDependencies';
import { WelcomeScreen } from './WelcomeScreen';

const renderWelcome = async (outcome?: Parameters<typeof createFakeDependencies>[0]) => {
  const fake = createFakeDependencies(outcome);
  await render(
    <AppProviders dependencies={fake.dependencies}>
      <WelcomeScreen />
    </AppProviders>,
  );
  return fake;
};

describe('WelcomeScreen', () => {
  it('mostra a marca e as ações "Entrar" e "Criar conta"', async () => {
    await renderWelcome();
    expect(screen.getByLabelText('BruzFin')).toBeOnTheScreen();
    expect(screen.getByText('Seu dinheiro, com clareza.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeOnTheScreen();
  });

  it('não tem campo de senha: o login acontece na página do provedor', async () => {
    await renderWelcome();
    expect(screen.queryByPlaceholderText(/senha/i)).toBeNull();
  });

  it('"Entrar" inicia o login e guarda a sessão', async () => {
    const { execute, sessionStore } = await renderWelcome('success');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(execute).toHaveBeenCalledWith({ mode: 'sign-in' });
    expect(sessionStore.current()).not.toBeNull();
  });

  it('"Criar conta" abre o fluxo de cadastro', async () => {
    const { execute } = await renderWelcome('cancelled');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(execute).toHaveBeenCalledWith({ mode: 'sign-up' });
  });

  it('cancelar o login volta para a tela sem mostrar erro', async () => {
    await renderWelcome('cancelled');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('falha mostra mensagem genérica em vermelho (negative)', async () => {
    await renderWelcome('failed');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Não foi possível entrar. Verifique sua conexão e tente novamente.',
    );
    expect(alert).toHaveStyle({ color: colors.light.negative });
  });

  it('botão principal segue o design: brand-600, 52px, toque ≥ 44px', async () => {
    await renderWelcome();
    expect(screen.getByTestId('welcome-sign-in')).toHaveStyle({
      height: 52,
      backgroundColor: colors.light.brand600,
    });
    expect(screen.getByTestId('welcome-sign-up')).toHaveStyle({ height: 52 });
  });
});

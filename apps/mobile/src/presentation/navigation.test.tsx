import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { AppState, type AppStateStatus } from 'react-native';
import { createFakeDependencies } from '../test/fakeDependencies';

// A raiz real do app (src/app/_layout.tsx) com dependências falsas e fontes já carregadas.
let mockFake = createFakeDependencies();
jest.mock('../composition/dependencies', () => ({
  createAppDependencies: () => mockFake.dependencies,
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('../infrastructure/security/useScreenCaptureProtection', () => ({
  useScreenCaptureProtection: () => {},
}));

const renderApp = async (initialUrl = '/') => {
  await renderRouter('./src/app', { initialUrl });
};

/** Simula o Android mandando o app para segundo plano e trazendo de volta. */
const appStateListeners: ((state: AppStateStatus) => void)[] = [];
jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
  appStateListeners.push(listener as (state: AppStateStatus) => void);
  return {
    remove: () => {
      appStateListeners.splice(appStateListeners.indexOf(listener as never), 1);
    },
  };
});
const emitAppState = (state: AppStateStatus) => {
  for (const listener of [...appStateListeners]) listener(state);
};

describe('guarda de rotas', () => {
  it('sem sessão, abrir o app leva à tela de entrada', async () => {
    mockFake = createFakeDependencies();
    await renderApp();
    expect(screen.getByText('Entrar na sua conta')).toBeOnTheScreen();
    expect(screen.queryByRole('tab', { name: 'Início' })).toBeNull();
  });

  it('ao concluir o login, leva ao Início com o nome do usuário', async () => {
    mockFake = createFakeDependencies('success');
    await renderApp();
    await act(async () => {
      await mockFake.dependencies.signIn.execute({ mode: 'sign-in' });
    });
    expect(await screen.findByText('Olá, Usuário')).toBeOnTheScreen();
    expect(screen.queryByText('Entrar na sua conta')).toBeNull();
  });

  it('com sessão, a tela de entrada não fica acessível', async () => {
    mockFake = createFakeDependencies('success', { signedIn: true });
    await renderApp('/entrar');
    expect(screen.queryByText('Entrar na sua conta')).toBeNull();
  });
});

describe('sessão segura', () => {
  it('ao reabrir o app com sessão salva, continua logado', async () => {
    mockFake = createFakeDependencies('success', { restoredSession: true });
    await renderApp();
    expect(mockFake.bootstrap).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Olá, Usuário')).toBeOnTheScreen();
  });

  it('se a sessão expirar durante o uso, volta para a entrada com aviso', async () => {
    mockFake = createFakeDependencies('success', { signedIn: true });
    await renderApp();
    await act(async () => {
      mockFake.sessionStore.clear('expired');
    });
    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeOnTheScreen();
  });

  it('"Sair" nas Configurações apaga a sessão e volta para a entrada', async () => {
    mockFake = createFakeDependencies('success', { signedIn: true });
    await renderApp();
    await fireEvent.press(screen.getByRole('button', { name: 'Configurações' }));
    expect(await screen.findByText('usuario@bruzfin.local')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));

    expect(mockFake.signOut).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Entrar na sua conta')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('bloqueio com biometria ou PIN', () => {
  it('ligado, ao abrir o app pede a biometria e libera o conteúdo', async () => {
    mockFake = createFakeDependencies('success', { restoredSession: true, appLockEnabled: true });
    await renderApp();
    expect(mockFake.authenticate).toHaveBeenCalledWith('Desbloquear o BruzFin');
    expect(screen.queryByText('BruzFin bloqueado')).toBeNull();
    expect(screen.getByText('Olá, Usuário')).toBeOnTheScreen();
  });

  it('cancelar a biometria mantém o bloqueio sobre o conteúdo', async () => {
    mockFake = createFakeDependencies('success', {
      restoredSession: true,
      appLockEnabled: true,
      unlockOutcome: 'cancelled',
    });
    await renderApp();
    expect(await screen.findByText('BruzFin bloqueado')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Desbloquear' })).toBeOnTheScreen();
    // O conteúdo por baixo fica fora da árvore de acessibilidade (TalkBack não lê).
    expect(screen.queryByText('Olá, Usuário')).toBeNull();
    expect(screen.getByText('Olá, Usuário', { includeHiddenElements: true })).toBeTruthy();
  });

  it('"Sair da conta" na tela de bloqueio volta para a entrada', async () => {
    mockFake = createFakeDependencies('success', {
      restoredSession: true,
      appLockEnabled: true,
      unlockOutcome: 'cancelled',
    });
    await renderApp();
    await fireEvent.press(await screen.findByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByText('Entrar na sua conta')).toBeOnTheScreen();
    expect(screen.queryByText('BruzFin bloqueado')).toBeNull();
  });

  it('volta a bloquear depois de 5 minutos em segundo plano', async () => {
    jest.useFakeTimers({ now: 0, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    try {
      mockFake = createFakeDependencies('success', {
        restoredSession: true,
        appLockEnabled: true,
        unlockOutcome: 'cancelled',
      });
      await renderApp();
      // Desbloqueia "à mão" para começar com o conteúdo visível.
      mockFake.authenticate.mockResolvedValue('success');
      await fireEvent.press(await screen.findByRole('button', { name: 'Desbloquear' }));
      expect(screen.queryByText('BruzFin bloqueado')).toBeNull();

      // Ao bloquear de novo, a tela pede a biometria sozinha: o usuário cancela para vermos o bloqueio.
      mockFake.authenticate.mockResolvedValue('cancelled');
      await act(async () => {
        emitAppState('background');
        jest.setSystemTime(5 * 60_000);
        emitAppState('active');
      });
      expect(await screen.findByText('BruzFin bloqueado')).toBeOnTheScreen();
      expect(mockFake.authenticate).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it('ligar o bloqueio nas Configurações pede a identificação', async () => {
    mockFake = createFakeDependencies('success', { signedIn: true });
    await renderApp('/configuracoes');
    const toggle = await screen.findByRole('switch', { name: 'Bloquear com biometria ou PIN' });
    await fireEvent(toggle, 'valueChange', true);
    expect(mockFake.authenticate).toHaveBeenCalledWith(
      'Confirme para ativar o bloqueio do BruzFin',
    );
    expect(mockFake.appLock.state().enabled).toBe(true);
  });

  it('sem biometria nem PIN no aparelho, explica e não liga', async () => {
    mockFake = createFakeDependencies('success', { signedIn: true, deviceAuthAvailable: false });
    await renderApp('/configuracoes');
    const toggle = await screen.findByRole('switch', { name: 'Bloquear com biometria ou PIN' });
    await fireEvent(toggle, 'valueChange', true);
    expect(
      await screen.findByText(
        'Configure uma biometria ou um PIN no aparelho para usar o bloqueio.',
      ),
    ).toBeOnTheScreen();
    expect(mockFake.appLock.state().enabled).toBe(false);
  });
});

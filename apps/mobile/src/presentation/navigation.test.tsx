import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
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

const renderApp = async () => {
  await renderRouter('./src/app', { initialUrl: '/' });
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
    await renderRouter('./src/app', { initialUrl: '/entrar' });
    expect(screen.queryByText('Entrar na sua conta')).toBeNull();
  });
});

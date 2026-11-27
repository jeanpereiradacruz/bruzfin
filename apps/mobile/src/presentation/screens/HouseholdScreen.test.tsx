import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Share } from 'react-native';
import { createFakeDependencies, otherHousehold, testInvite } from '../../test/fakeDependencies';
import { formatInviteExpiry, inviteShareMessage } from './HouseholdScreen';

let mockFake = createFakeDependencies('success', { signedIn: true });
jest.mock('../../composition/dependencies', () => ({
  createAppDependencies: () => mockFake.dependencies,
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('../../infrastructure/security/useScreenCaptureProtection', () => ({
  useScreenCaptureProtection: () => {},
}));

const openHousehold = async () => {
  await renderRouter('./src/app', { initialUrl: '/lar' });
  await screen.findByText('Membros (1)');
};

beforeEach(() => {
  mockFake = createFakeDependencies('success', { signedIn: true });
});

describe('tela do lar', () => {
  it('mostra o nome, os membros e o papel de cada um', async () => {
    await openHousehold();

    expect(screen.getByDisplayValue('Lar de Usuário')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Usuário de Teste, você, Criou o lar, usuario@bruzfin.local'),
    ).toBeOnTheScreen();
  });

  it('nas Configurações, o lar leva para esta tela', async () => {
    await renderRouter('./src/app', { initialUrl: '/configuracoes' });

    await fireEvent.press(await screen.findByTestId('settings-household'));

    expect(await screen.findByText('Membros (1)')).toBeOnTheScreen();
  });

  it('renomeia o lar e confirma', async () => {
    await openHousehold();
    expect(screen.getByRole('button', { name: 'Salvar nome do lar' })).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('household-name'), 'Casa da praia');
    await fireEvent.press(screen.getByTestId('household-rename'));

    expect(mockFake.household.rename).toHaveBeenCalledWith('Casa da praia');
    expect(screen.getByText('Nome salvo.')).toBeOnTheScreen();
  });

  it('mostra o erro ao renomear', async () => {
    mockFake.household.rename.mockResolvedValueOnce(
      mockFake.householdError('household.unavailable', 'Sem conexão.'),
    );
    await openHousehold();

    await fireEvent.changeText(screen.getByTestId('household-name'), 'Casa');
    await fireEvent.press(screen.getByTestId('household-rename'));

    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão.');
  });

  it('gera o código de convite e compartilha pelo menu do Android', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await openHousehold();

    await fireEvent.press(screen.getByTestId('household-invite'));

    expect(screen.getByTestId('household-invite-code')).toHaveTextContent('ABCD-1230');
    expect(screen.getByRole('button', { name: 'Gerar outro código' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('household-share'));
    expect(share).toHaveBeenCalledWith({
      message: inviteShareMessage('Lar de Usuário', testInvite),
    });
  });

  it('entra em outro lar com o código', async () => {
    await openHousehold();

    await fireEvent.changeText(screen.getByTestId('household-code'), 'abcd-1230');
    await fireEvent.press(screen.getByTestId('household-accept'));

    expect(mockFake.household.acceptInvite).toHaveBeenCalledWith('abcd-1230');
    expect(screen.queryByRole('button', { name: 'Entrar no lar' })).toBeNull();
    expect(screen.getByDisplayValue(otherHousehold.name)).toBeOnTheScreen();
    expect(screen.getByText('Membros (2)')).toBeOnTheScreen();
    // Com outros membros não dá para trocar de novo: a seção some.
    expect(screen.queryByTestId('household-code')).toBeNull();
  });

  it('código vencido mostra a mensagem e mantém o lar atual', async () => {
    mockFake.household.acceptInvite.mockResolvedValueOnce(
      mockFake.householdError('household.invite-expired', 'Este convite venceu.'),
    );
    await openHousehold();

    await fireEvent.changeText(screen.getByTestId('household-code'), 'ABCD-1230');
    await fireEvent.press(screen.getByTestId('household-accept'));

    expect(screen.getByRole('alert')).toHaveTextContent('Este convite venceu.');
    expect(screen.getByDisplayValue('Lar de Usuário')).toBeOnTheScreen();
  });

  it('sem conexão ao abrir, explica e deixa tentar de novo', async () => {
    mockFake.household.load.mockResolvedValueOnce(
      mockFake.householdError('household.unavailable', 'Sem conexão.'),
    );
    await renderRouter('./src/app', { initialUrl: '/lar' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão.');
    await fireEvent.press(screen.getByTestId('household-retry'));

    expect(await screen.findByText('Membros (1)')).toBeOnTheScreen();
  });
});

describe('mensagem do convite', () => {
  it('traz o lar, o código e a validade', () => {
    const message = inviteShareMessage('Lar de Usuário', testInvite);
    expect(message).toContain('"Lar de Usuário"');
    expect(message).toContain('ABCD-1230');
    expect(message).toContain(formatInviteExpiry(testInvite.expiresAt));
    expect(formatInviteExpiry(testInvite.expiresAt)).toMatch(/^\d{2}\/\d{2} às \d{2}:\d{2}$/);
  });
});

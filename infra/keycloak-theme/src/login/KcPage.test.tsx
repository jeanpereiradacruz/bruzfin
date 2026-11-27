import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import KcPage from './KcPage';
import { getKcContextMock } from './mocks';

afterEach(cleanup);

type PageId = Parameters<typeof getKcContextMock>[0]['pageId'];
const renderPage = (pageId: PageId, overrides: object = {}) =>
  render(<KcPage kcContext={getKcContextMock({ pageId, overrides })} />);

describe('Entrar na sua conta', () => {
  it('mostra email, senha, esqueci minha senha e criar conta', async () => {
    renderPage('login.ftl');

    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toHaveProperty('type', 'email');
    expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'password');
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(document.getElementById('kc-form-login')).not.toBeNull();
  });

  it('mostra e oculta a senha', async () => {
    renderPage('login.ftl');
    const toggle = await screen.findByRole('button', { name: 'Mostrar senha' });

    await userEvent.click(toggle);

    expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('erro de credenciais é genérico e fica junto do campo', async () => {
    renderPage('login.ftl', {
      messagesPerField: {
        existsError: (...fields: string[]) => fields.includes('username'),
        getFirstError: () => 'Email ou senha inválidos.',
      },
      message: { type: 'error', summary: 'Email ou senha inválidos.' },
    });

    const email = await screen.findByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getAllByText('Email ou senha inválidos.')).toHaveLength(1);
  });

  it('com Google configurado, mostra "Continuar com Google"', async () => {
    renderPage('login.ftl', {
      social: {
        displayInfo: true,
        providers: [
          {
            alias: 'google',
            providerId: 'google',
            displayName: 'Google',
            loginUrl: '/broker/google',
          },
        ],
      },
    });

    const google = await screen.findByRole('link', { name: 'Continuar com Google' });
    expect(google.getAttribute('href')).toBe('/broker/google');
  });

  it('sem provedores, não mostra o "ou"', async () => {
    renderPage('login.ftl', { social: { displayInfo: true, providers: [] } });
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    expect(screen.queryByText('ou')).toBeNull();
  });

  it('depois de pedir a recuperação, mostra "Confira seu email" com reenvio', async () => {
    renderPage('login.ftl', {
      message: {
        type: 'success',
        summary: 'Se existir uma conta com este email, o link chega em instantes.',
      },
    });

    expect(await screen.findByRole('heading', { name: 'Confira seu email' })).toBeTruthy();
    expect(screen.getByText(/vale por 30 minutos/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Não recebeu? Enviar de novo' })).toBeTruthy();
    expect(screen.queryByLabelText('Senha')).toBeNull();
  });
});

describe('Criar conta', () => {
  it('quando o Keycloak pede a senha no cadastro: nome, email, senha e confirmação', async () => {
    renderPage('register.ftl');

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeTruthy();
    expect(screen.getByLabelText('Nome')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.queryByLabelText('Nome de usuário')).toBeNull();
    const password = screen.getByLabelText('Senha');
    expect(password.getAttribute('autocomplete')).toBe('new-password');
    expect(screen.getByText('Mínimo de 8 caracteres, com letras e números.')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar senha')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeTruthy();
  });

  it('como no Keycloak 26 com verificação de email: sem `passwordRequired`, a senha fica para depois', async () => {
    const kcContext = getKcContextMock({ pageId: 'register.ftl', overrides: {} });
    const { passwordRequired: _ignored, ...withoutFlag } = kcContext;
    render(
      <KcPage
        kcContext={
          {
            ...withoutFlag,
            profile: {
              ...kcContext.profile,
              attributesByName: {
                ...kcContext.profile.attributesByName,
                locale: {
                  name: 'locale',
                  displayName: 'locale',
                  required: false,
                  readOnly: false,
                  validators: {},
                  annotations: {},
                },
              },
            },
          } as unknown as typeof kcContext
        }
      />,
    );

    expect(await screen.findByLabelText('Email')).toBeTruthy();
    expect(screen.queryByLabelText('Senha')).toBeNull();
    expect(screen.queryByLabelText('locale')).toBeNull();
    expect(document.querySelector<HTMLInputElement>('input[name="locale"]')?.value).toBe('pt-BR');
  });

  it('email já cadastrado mostra texto genérico', async () => {
    renderPage('register.ftl', {
      messagesPerField: {
        get: (field: string) =>
          field === 'email'
            ? 'Não foi possível criar a conta com esses dados. Se você já tem conta, entre ou recupere a senha.'
            : '',
        exists: (field: string) => field === 'email',
        existsError: (...fields: string[]) => fields.includes('email'),
      },
    });

    expect(await screen.findByText(/Não foi possível criar a conta com esses dados/)).toBeTruthy();
    expect(screen.queryByText(/já existe/i)).toBeNull();
  });
});

describe('Recuperar senha', () => {
  it('pede o email e envia o link', async () => {
    renderPage('login-reset-password.ftl');

    expect(await screen.findByRole('heading', { name: 'Recuperar senha' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toBeTruthy();
  });
});

describe('Confira seu email (cadastro)', () => {
  it('mostra o email informado e o reenvio', async () => {
    renderPage('login-verify-email.ftl', { user: { email: 'nova@bruzfin.local' } });

    expect(await screen.findByRole('heading', { name: 'Confira seu email' })).toBeTruthy();
    expect(
      screen.getByText('Enviamos um link de confirmação para nova@bruzfin.local.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Não recebeu? Enviar de novo' })).toBeTruthy();
  });
});

describe('Telas de apoio', () => {
  it('link vencido mostra "Link expirado"', async () => {
    renderPage('error.ftl', {
      message: { type: 'error', summary: 'Este link já venceu. Peça um novo.' },
    });

    expect(await screen.findByRole('heading', { name: 'Link expirado' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toBeTruthy();
  });

  it('outros erros mostram "Algo deu errado" com a mensagem', async () => {
    renderPage('error.ftl', { message: { type: 'error', summary: 'Cliente inválido.' } });

    expect(await screen.findByRole('heading', { name: 'Algo deu errado' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Cliente inválido.');
  });

  it('nova senha sempre encerra as outras sessões', async () => {
    renderPage('login-update-password.ftl');

    expect(await screen.findByRole('heading', { name: 'Crie sua senha' })).toBeTruthy();
    expect(screen.getByLabelText('Nova senha')).toBeTruthy();
    const logout = document.querySelector<HTMLInputElement>('input[name="logout-sessions"]');
    expect(logout?.value).toBe('on');
    expect(logout?.type).toBe('hidden');
  });

  it('confirmar vínculo de conta (Google)', async () => {
    renderPage('login-idp-link-confirm.ftl', { idpAlias: 'google' });

    expect(await screen.findByRole('heading', { name: 'Essa conta já existe' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Confirmar que a conta é minha' }).getAttribute('value'),
    ).toBe('linkAccount');
  });

  it('aviso final sem próximo passo manda voltar ao app', async () => {
    renderPage('info.ftl', {
      message: { type: 'success', summary: 'Sua conta está pronta.' },
      messageHeader: undefined,
      skipLink: false,
      pageRedirectUri: undefined,
      actionUri: undefined,
      client: { baseUrl: undefined },
    });

    expect(await screen.findByRole('heading', { name: 'Tudo certo' })).toBeTruthy();
    expect(screen.getByText('Sua conta está pronta.')).toBeTruthy();
    expect(screen.getByText(/Volte ao app BruzFin/)).toBeTruthy();
  });

  it('página expirada leva de volta ao login', async () => {
    renderPage('login-page-expired.ftl');
    expect(await screen.findByRole('heading', { name: 'Página expirada' })).toBeTruthy();
  });

  it('telas não personalizadas usam a mesma moldura', async () => {
    renderPage('login-otp.ftl');
    expect(await screen.findByRole('img', { name: 'BruzFin' })).toBeTruthy();
  });
});

describe('Tema', () => {
  it('usa as cores dos design tokens no claro e no escuro', async () => {
    renderPage('login.ftl');
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    expect(css).toContain('--brand-600: #0f7a5a;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--brand-600: #3fbf8f;');
  });

  it('título da aba e idioma da página', async () => {
    renderPage('login.ftl');
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    expect(document.title).toBe('BruzFin');
    expect(document.documentElement.lang).toBe('pt-BR');
  });
});

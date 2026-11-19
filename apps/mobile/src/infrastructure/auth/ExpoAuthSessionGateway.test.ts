import type { AuthRequestConfig, AuthSessionResult, DiscoveryDocument } from 'expo-auth-session';
import { type ExpoAuthSessionDriver, ExpoAuthSessionGateway } from './ExpoAuthSessionGateway';

const config = {
  issuer: 'http://localhost:8180/realms/bruzfin',
  clientId: 'bruzfin-mobile',
  redirectUri: 'bruzfin://auth/callback',
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${config.issuer}/protocol/openid-connect/auth`,
  tokenEndpoint: `${config.issuer}/protocol/openid-connect/token`,
};

const success = (code = 'codigo-123'): AuthSessionResult =>
  ({
    type: 'success',
    params: { code, state: 's' },
    errorCode: null,
    authentication: null,
    url: '',
  }) as AuthSessionResult;

const createDriver = (
  result: AuthSessionResult,
  overrides: Partial<ExpoAuthSessionDriver> = {},
) => {
  const prompts: AuthRequestConfig[] = [];
  const driver: ExpoAuthSessionDriver = {
    fetchDiscovery: jest.fn(async () => discovery),
    prompt: jest.fn(async (requestConfig: AuthRequestConfig) => {
      prompts.push(requestConfig);
      return { result, codeVerifier: 'verificador-pkce' };
    }),
    exchangeCode: jest.fn(
      async () =>
        ({
          accessToken: 'access',
          refreshToken: 'refresh',
          idToken: 'id',
          issuedAt: 1_700_000_000,
          expiresIn: 300,
        }) as Awaited<ReturnType<ExpoAuthSessionDriver['exchangeCode']>>,
    ),
    ...overrides,
  };
  return { driver, prompts };
};

describe('ExpoAuthSessionGateway', () => {
  it('usa Authorization Code + PKCE S256 com o redirect do app', async () => {
    const { driver, prompts } = createDriver(success());
    await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });

    expect(driver.fetchDiscovery).toHaveBeenCalledWith(config.issuer);
    expect(prompts[0]).toMatchObject({
      clientId: 'bruzfin-mobile',
      redirectUri: 'bruzfin://auth/callback',
      responseType: 'code',
      usePKCE: true,
      codeChallengeMethod: 'S256',
      scopes: ['openid', 'profile', 'email'],
    });
    expect(prompts[0]?.extraParams).toBeUndefined();
  });

  it('troca o código pelo token enviando o code_verifier e calcula a expiração', async () => {
    const { driver } = createDriver(success('abc'));
    const result = await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });

    expect(driver.exchangeCode).toHaveBeenCalledWith(
      {
        clientId: 'bruzfin-mobile',
        redirectUri: 'bruzfin://auth/callback',
        code: 'abc',
        extraParams: { code_verifier: 'verificador-pkce' },
      },
      discovery,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        accessToken: 'access',
        refreshToken: 'refresh',
        idToken: 'id',
        expiresAt: 1_700_000_300_000,
      },
    });
  });

  it('cadastro pede prompt=create ao Keycloak', async () => {
    const { driver, prompts } = createDriver(success());
    await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-up' });
    expect(prompts[0]?.extraParams).toEqual({ prompt: 'create' });
  });

  it.each(['cancel', 'dismiss', 'locked'] as const)('"%s" vira cancelamento', async (type) => {
    const { driver } = createDriver({ type } as AuthSessionResult);
    const result = await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth.cancelled');
    expect(driver.exchangeCode).not.toHaveBeenCalled();
  });

  it('erro do provedor (ex.: state_mismatch) vira falha sem trocar o código', async () => {
    const { driver } = createDriver({
      type: 'error',
      params: { error: 'state_mismatch' },
      errorCode: 'state_mismatch',
      authentication: null,
      url: '',
    } as AuthSessionResult);
    const result = await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth.failed');
    expect(driver.exchangeCode).not.toHaveBeenCalled();
  });

  it('sem internet na descoberta vira falha', async () => {
    const { driver } = createDriver(success(), {
      fetchDiscovery: jest.fn(async () => {
        throw new TypeError('Network request failed');
      }),
    });
    const result = await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth.failed');
  });

  it('troca do código recusada vira falha', async () => {
    const { driver } = createDriver(success(), {
      exchangeCode: jest.fn(async () => {
        throw new Error('invalid_grant');
      }),
    });
    const result = await new ExpoAuthSessionGateway(config, driver).authorize({ mode: 'sign-in' });
    expect(result.ok).toBe(false);
  });
});

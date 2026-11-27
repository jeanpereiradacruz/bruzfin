import {
  type AuthRequestConfig,
  type AuthSessionResult,
  type DiscoveryDocument,
  TokenError,
} from 'expo-auth-session';
import { type ExpoAuthSessionDriver, ExpoAuthSessionGateway } from './ExpoAuthSessionGateway';

const config = {
  issuer: 'http://localhost:8180/realms/bruzfin',
  clientId: 'bruzfin-mobile',
  redirectUri: 'bruzfin://auth/callback',
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${config.issuer}/protocol/openid-connect/auth`,
  tokenEndpoint: `${config.issuer}/protocol/openid-connect/token`,
  endSessionEndpoint: `${config.issuer}/protocol/openid-connect/logout`,
};

const tokenResponse = (accessToken = 'access', refreshToken = 'refresh') =>
  ({
    accessToken,
    refreshToken,
    idToken: 'id',
    issuedAt: 1_700_000_000,
    expiresIn: 300,
  }) as Awaited<ReturnType<ExpoAuthSessionDriver['exchangeCode']>>;

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
    exchangeCode: jest.fn(async () => tokenResponse()),
    refresh: jest.fn(async () => tokenResponse('access-2', 'refresh-2')),
    postForm: jest.fn(async () => 204),
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

  it('reaproveita a descoberta OIDC entre chamadas', async () => {
    const { driver } = createDriver(success());
    const gateway = new ExpoAuthSessionGateway(config, driver);
    await gateway.authorize({ mode: 'sign-in' });
    await gateway.refresh('refresh');
    expect(driver.fetchDiscovery).toHaveBeenCalledTimes(1);
  });

  describe('renovação', () => {
    it('troca o refresh token por tokens novos (rotação)', async () => {
      const { driver } = createDriver(success());
      const result = await new ExpoAuthSessionGateway(config, driver).refresh('refresh-1');

      expect(driver.refresh).toHaveBeenCalledWith(
        {
          clientId: 'bruzfin-mobile',
          refreshToken: 'refresh-1',
          scopes: ['openid', 'profile', 'email'],
        },
        discovery,
      );
      expect(result).toEqual({
        ok: true,
        value: {
          accessToken: 'access-2',
          refreshToken: 'refresh-2',
          idToken: 'id',
          expiresAt: 1_700_000_300_000,
        },
      });
    });

    it('invalid_grant (refresh revogado ou sessão expirada) vira sessão expirada', async () => {
      const { driver } = createDriver(success(), {
        refresh: jest.fn(async () => {
          throw new TokenError({ error: 'invalid_grant' });
        }),
      });
      const result = await new ExpoAuthSessionGateway(config, driver).refresh('refresh-1');
      expect(!result.ok && result.error.code).toBe('auth.session-expired');
    });

    it('sem internet vira offline (a sessão continua)', async () => {
      const { driver } = createDriver(success(), {
        refresh: jest.fn(async () => {
          throw new TypeError('Network request failed');
        }),
      });
      const result = await new ExpoAuthSessionGateway(config, driver).refresh('refresh-1');
      expect(!result.ok && result.error.code).toBe('auth.offline');
    });

    it('outro erro OAuth do servidor (ex.: temporarily_unavailable) vira offline', async () => {
      const { driver } = createDriver(success(), {
        refresh: jest.fn(async () => {
          throw new TokenError({ error: 'temporarily_unavailable' });
        }),
      });
      const result = await new ExpoAuthSessionGateway(config, driver).refresh('refresh-1');
      expect(!result.ok && result.error.code).toBe('auth.offline');
    });
  });

  describe('encerrar a sessão no Keycloak', () => {
    it('envia o refresh token ao endpoint de logout', async () => {
      const { driver } = createDriver(success());
      const result = await new ExpoAuthSessionGateway(config, driver).endSession('refresh-1');

      expect(driver.postForm).toHaveBeenCalledWith(discovery.endSessionEndpoint, {
        client_id: 'bruzfin-mobile',
        refresh_token: 'refresh-1',
      });
      expect(result.ok).toBe(true);
    });

    it('token que o Keycloak já não reconhece (400) conta como encerrado', async () => {
      const { driver } = createDriver(success(), { postForm: jest.fn(async () => 400) });
      const result = await new ExpoAuthSessionGateway(config, driver).endSession('velho');
      expect(result.ok).toBe(true);
    });

    it('Keycloak fora do ar (5xx) ou sem rede vira offline, para tentar depois', async () => {
      const down = createDriver(success(), { postForm: jest.fn(async () => 503) });
      const noNetwork = createDriver(success(), {
        postForm: jest.fn(async () => {
          throw new TypeError('Network request failed');
        }),
      });
      const results = await Promise.all([
        new ExpoAuthSessionGateway(config, down.driver).endSession('r'),
        new ExpoAuthSessionGateway(config, noNetwork.driver).endSession('r'),
      ]);
      expect(results.map((result) => result.ok)).toEqual([false, false]);
    });
  });
});

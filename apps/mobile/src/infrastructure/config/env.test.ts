import { parseAppConfig } from './env';

describe('parseAppConfig', () => {
  it('em desenvolvimento usa o ambiente local quando nada é informado', () => {
    expect(parseAppConfig({}, true)).toEqual({
      apiUrl: 'http://localhost:8080',
      authIssuer: 'http://localhost:8180/realms/bruzfin',
      authClientId: 'bruzfin-mobile',
    });
  });

  it('usa as variáveis EXPO_PUBLIC_* quando informadas', () => {
    const config = parseAppConfig(
      {
        EXPO_PUBLIC_API_URL: 'https://api.bruzfin.app',
        EXPO_PUBLIC_AUTH_ISSUER: 'https://auth.bruzfin.app/realms/bruzfin',
        EXPO_PUBLIC_AUTH_CLIENT_ID: 'bruzfin-mobile',
      },
      false,
    );
    expect(config.apiUrl).toBe('https://api.bruzfin.app');
  });

  it('em release exige todas as variáveis', () => {
    expect(() => parseAppConfig({}, false)).toThrow();
  });

  it('em release recusa URL sem HTTPS', () => {
    expect(() =>
      parseAppConfig(
        {
          EXPO_PUBLIC_API_URL: 'http://localhost:8080',
          EXPO_PUBLIC_AUTH_ISSUER: 'https://auth.bruzfin.app/realms/bruzfin',
          EXPO_PUBLIC_AUTH_CLIENT_ID: 'bruzfin-mobile',
        },
        false,
      ),
    ).toThrow('HTTPS');
  });
});

import { configureApiClient } from '@bruzfin/api-client';
import { InMemorySessionStore, type SessionStore, SignIn } from '@bruzfin/core';
import { ApiCurrentUserGateway } from '../infrastructure/api/ApiCurrentUserGateway';
import { ExpoAuthSessionGateway } from '../infrastructure/auth/ExpoAuthSessionGateway';
import { AUTH_REDIRECT_URI, readAppConfig } from '../infrastructure/config/env';

/**
 * Dependências do app montadas no composition root.
 * Cada ticket que criar uma porta no @bruzfin/core adiciona aqui o caso de uso já ligado ao adapter.
 */
export type AppDependencies = {
  readonly sessionStore: SessionStore;
  readonly signIn: Pick<SignIn, 'execute'>;
};

export const createAppDependencies = (): AppDependencies => {
  const config = readAppConfig();
  // Tokens só em memória neste momento; Keystore (SecureStore) entra no KAN-29.
  const sessionStore = new InMemorySessionStore();

  configureApiClient({
    baseUrl: config.apiUrl,
    getAccessToken: () => sessionStore.current()?.tokens.accessToken,
  });

  const authGateway = new ExpoAuthSessionGateway({
    issuer: config.authIssuer,
    clientId: config.authClientId,
    redirectUri: AUTH_REDIRECT_URI,
  });

  return {
    sessionStore,
    signIn: new SignIn(authGateway, new ApiCurrentUserGateway(), sessionStore),
  };
};

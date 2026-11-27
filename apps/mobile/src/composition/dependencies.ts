import { configureApiClient } from '@bruzfin/api-client';
import {
  AppLock,
  HouseholdService,
  InMemorySessionStore,
  SessionManager,
  type SessionStore,
  SignIn,
} from '@bruzfin/core';
import { ApiCurrentUserGateway } from '../infrastructure/api/ApiCurrentUserGateway';
import { ApiHouseholdGateway } from '../infrastructure/api/ApiHouseholdGateway';
import { ExpoAuthSessionGateway } from '../infrastructure/auth/ExpoAuthSessionGateway';
import { AUTH_REDIRECT_URI, readAppConfig } from '../infrastructure/config/env';
import { ExpoDeviceAuthenticator } from '../infrastructure/security/ExpoDeviceAuthenticator';
import {
  SecureAppLockSettings,
  SecurePendingRevocationQueue,
  SecureTokenStorage,
} from '../infrastructure/storage/secureStorage';

/** Parte do `AppLock` que a UI usa (estado observável e ações). */
export type AppLockPort = Pick<
  AppLock,
  'state' | 'subscribe' | 'enable' | 'disable' | 'unlock' | 'onBackground' | 'onForeground'
>;

/**
 * Dependências do app montadas no composition root.
 * Cada ticket que criar uma porta no @bruzfin/core adiciona aqui o caso de uso já ligado ao adapter.
 */
export type AppDependencies = {
  readonly sessionStore: SessionStore;
  readonly signIn: Pick<SignIn, 'execute'>;
  /** Sai da conta: apaga os tokens do aparelho e encerra a sessão no Keycloak (ou agenda, se offline). */
  readonly signOut: () => Promise<void>;
  readonly appLock: AppLockPort;
  /** Lar do usuário: ver, renomear, convidar e entrar com código. */
  readonly household: Pick<HouseholdService, 'load' | 'rename' | 'createInvite' | 'acceptInvite'>;
  /** Ao abrir o app: restaura a sessão do Keystore (renovando se venceu) e prepara o bloqueio. */
  readonly bootstrap: () => Promise<void>;
};

export const createAppDependencies = (): AppDependencies => {
  const config = readAppConfig();
  const sessionStore = new InMemorySessionStore();

  const authGateway = new ExpoAuthSessionGateway({
    issuer: config.authIssuer,
    clientId: config.authClientId,
    redirectUri: AUTH_REDIRECT_URI,
  });
  const sessionManager = new SessionManager(
    authGateway,
    new SecureTokenStorage(),
    sessionStore,
    new SecurePendingRevocationQueue(),
  );
  const appLock = new AppLock(
    new SecureAppLockSettings(),
    new ExpoDeviceAuthenticator(),
    () => sessionStore.current() !== null,
  );

  // Sessão encerrada (sair ou expirada): nada a proteger até o próximo login.
  sessionStore.subscribe(() => {
    if (sessionStore.current() === null) appLock.release();
  });

  configureApiClient({
    baseUrl: config.apiUrl,
    getAccessToken: () => sessionManager.getAccessToken(),
    onUnauthorized: (rejected) => sessionManager.handleUnauthorized(rejected),
  });

  return {
    sessionStore,
    signIn: new SignIn(authGateway, new ApiCurrentUserGateway(), sessionManager),
    signOut: () => sessionManager.signOut(),
    appLock,
    household: new HouseholdService(new ApiHouseholdGateway(), sessionManager),
    bootstrap: async () => {
      await sessionManager.restore();
      await appLock.initialize();
    },
  };
};

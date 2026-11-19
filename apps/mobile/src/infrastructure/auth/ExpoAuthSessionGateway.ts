import {
  type AuthGateway,
  type AuthorizationError,
  type AuthorizationMode,
  type AuthTokens,
  domainError,
  err,
  ok,
  type Result,
} from '@bruzfin/core';
import {
  AuthRequest,
  type AuthRequestConfig,
  type AuthSessionResult,
  CodeChallengeMethod,
  type DiscoveryDocument,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  ResponseType,
} from 'expo-auth-session';

export type ExpoAuthSessionConfig = {
  readonly issuer: string;
  readonly clientId: string;
  readonly redirectUri: string;
};

/** Pontos de contato com o expo-auth-session, trocáveis nos testes. */
export type ExpoAuthSessionDriver = {
  fetchDiscovery(issuer: string): Promise<DiscoveryDocument>;
  prompt(
    config: AuthRequestConfig,
    discovery: DiscoveryDocument,
  ): Promise<{ result: AuthSessionResult; codeVerifier: string | undefined }>;
  exchangeCode: typeof exchangeCodeAsync;
};

const defaultDriver: ExpoAuthSessionDriver = {
  fetchDiscovery: fetchDiscoveryAsync,
  async prompt(config, discovery) {
    const request = new AuthRequest(config);
    // promptAsync gera o PKCE (S256), abre o Custom Tab e valida o `state` da resposta
    // (devolve `state_mismatch` como erro se não bater).
    const result = await request.promptAsync(discovery);
    return { result, codeVerifier: request.codeVerifier };
  },
  exchangeCode: exchangeCodeAsync,
};

const SCOPES = ['openid', 'profile', 'email'];

/**
 * Adapter do `AuthGateway` com OAuth2 Authorization Code + PKCE pelo navegador seguro do sistema
 * (Custom Tabs). A senha é digitada só na página do Keycloak; o app recebe apenas o código e troca por
 * tokens. Detalhes técnicos de erro não saem daqui (nem para logs): podem conter dados da sessão.
 */
export class ExpoAuthSessionGateway implements AuthGateway {
  constructor(
    private readonly config: ExpoAuthSessionConfig,
    private readonly driver: ExpoAuthSessionDriver = defaultDriver,
  ) {}

  async authorize({
    mode,
  }: {
    readonly mode: AuthorizationMode;
  }): Promise<Result<AuthTokens, AuthorizationError>> {
    try {
      const discovery = await this.driver.fetchDiscovery(this.config.issuer);
      const { result, codeVerifier } = await this.driver.prompt(
        {
          clientId: this.config.clientId,
          redirectUri: this.config.redirectUri,
          responseType: ResponseType.Code,
          scopes: SCOPES,
          usePKCE: true,
          codeChallengeMethod: CodeChallengeMethod.S256,
          // OIDC "prompt=create": abre direto a página de cadastro do Keycloak.
          ...(mode === 'sign-up' ? { extraParams: { prompt: 'create' } } : {}),
        },
        discovery,
      );

      if (result.type !== 'success') {
        return result.type === 'error' ? failed() : cancelled();
      }
      const code = result.params.code;
      if (!code || !codeVerifier) return failed();

      const token = await this.driver.exchangeCode(
        {
          clientId: this.config.clientId,
          redirectUri: this.config.redirectUri,
          code,
          extraParams: { code_verifier: codeVerifier },
        },
        discovery,
      );
      return ok({
        accessToken: token.accessToken,
        ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
        ...(token.idToken ? { idToken: token.idToken } : {}),
        expiresAt: (token.issuedAt + (token.expiresIn ?? 0)) * 1000,
      });
    } catch {
      // Sem internet, Keycloak fora do ar ou troca do código recusada.
      return failed();
    }
  }
}

const cancelled = () => err(domainError('auth.cancelled', 'Login cancelado.'));
const failed = () => err(domainError('auth.failed', 'Não foi possível entrar.'));

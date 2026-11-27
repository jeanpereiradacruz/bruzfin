import {
  type AuthGateway,
  type AuthorizationError,
  type AuthorizationMode,
  type AuthTokens,
  type DomainError,
  domainError,
  err,
  ok,
  type Result,
  type TokenGateway,
  type TokenRefreshError,
} from '@bruzfin/core';
import {
  AuthRequest,
  type AuthRequestConfig,
  type AuthSessionResult,
  CodeChallengeMethod,
  type DiscoveryDocument,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  ResponseError,
  ResponseType,
  refreshAsync,
  type TokenResponse,
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
  refresh: typeof refreshAsync;
  /** POST `application/x-www-form-urlencoded`; devolve só o status HTTP. */
  postForm(url: string, form: Record<string, string>): Promise<number>;
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
  refresh: refreshAsync,
  async postForm(url, form) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
    });
    return response.status;
  },
};

const SCOPES = ['openid', 'profile', 'email'];

/** Respostas OAuth que significam "não adianta tentar de novo: é preciso entrar outra vez". */
const DEFINITIVE_REFRESH_ERRORS = new Set([
  'invalid_grant',
  'invalid_client',
  'unauthorized_client',
]);

/**
 * Adapter do `AuthGateway` com OAuth2 Authorization Code + PKCE pelo navegador seguro do sistema
 * (Custom Tabs). A senha é digitada só na página do Keycloak; o app recebe apenas o código e troca por
 * tokens. Detalhes técnicos de erro não saem daqui (nem para logs): podem conter dados da sessão.
 */
export class ExpoAuthSessionGateway implements AuthGateway, TokenGateway {
  private discovery: Promise<DiscoveryDocument> | null = null;

  constructor(
    private readonly config: ExpoAuthSessionConfig,
    private readonly driver: ExpoAuthSessionDriver = defaultDriver,
  ) {}

  /** Descoberta OIDC uma vez por execução; se falhar (sem rede), tenta de novo na próxima chamada. */
  private getDiscovery(): Promise<DiscoveryDocument> {
    if (!this.discovery) {
      this.discovery = this.driver.fetchDiscovery(this.config.issuer).catch((error: unknown) => {
        this.discovery = null;
        throw error;
      });
    }
    return this.discovery;
  }

  async authorize({
    mode,
  }: {
    readonly mode: AuthorizationMode;
  }): Promise<Result<AuthTokens, AuthorizationError>> {
    try {
      const discovery = await this.getDiscovery();
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
      return ok(toAuthTokens(token));
    } catch {
      // Sem internet, Keycloak fora do ar ou troca do código recusada.
      return failed();
    }
  }

  /** Renova com o refresh token (o Keycloak devolve um refresh novo e invalida o anterior). */
  async refresh(refreshToken: string): Promise<Result<AuthTokens, TokenRefreshError>> {
    try {
      const discovery = await this.getDiscovery();
      const token = await this.driver.refresh(
        { clientId: this.config.clientId, refreshToken, scopes: SCOPES },
        discovery,
      );
      return ok(toAuthTokens(token));
    } catch (error) {
      // invalid_grant = refresh revogado, já usado ou sessão expirada no Keycloak.
      // Qualquer outra falha (rede, provedor fora do ar) é passageira.
      return error instanceof ResponseError && DEFINITIVE_REFRESH_ERRORS.has(error.code)
        ? err(domainError('auth.session-expired', 'Sua sessão expirou. Entre novamente.'))
        : offline();
    }
  }

  /**
   * Encerra a sessão no Keycloak (logout pelo back-channel com o refresh token): invalida o refresh
   * e a sessão SSO, então o próximo "Entrar" pede a senha de novo.
   */
  async endSession(refreshToken: string): Promise<Result<void, DomainError<'auth.offline'>>> {
    try {
      const discovery = await this.getDiscovery();
      if (!discovery.endSessionEndpoint) return offline();
      const status = await this.driver.postForm(discovery.endSessionEndpoint, {
        client_id: this.config.clientId,
        refresh_token: refreshToken,
      });
      // 2xx: encerrada. 400/401: token ou sessão já não existem — nada mais a revogar.
      if ((status >= 200 && status < 300) || status === 400 || status === 401) return ok(undefined);
      return offline();
    } catch {
      return offline();
    }
  }
}

const toAuthTokens = (token: TokenResponse): AuthTokens => ({
  accessToken: token.accessToken,
  ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
  ...(token.idToken ? { idToken: token.idToken } : {}),
  // `issuedAt` é o relógio do aparelho na chegada da resposta e `expiresIn` é relativo:
  // a diferença de relógio com o servidor não afeta a expiração calculada.
  expiresAt: (token.issuedAt + (token.expiresIn ?? 0)) * 1000,
});

const offline = () => err(domainError('auth.offline', 'Sem conexão com o servidor de login.'));

const cancelled = () => err(domainError('auth.cancelled', 'Login cancelado.'));
const failed = () => err(domainError('auth.failed', 'Não foi possível entrar.'));

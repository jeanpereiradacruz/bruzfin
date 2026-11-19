/**
 * Tokens emitidos pelo provedor de identidade (Keycloak) ao final do Authorization Code + PKCE.
 * São segredos: nunca vão para logs. A senha do usuário nunca chega ao app.
 */
export type AuthTokens = {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly idToken?: string;
  /** Momento (epoch em ms) em que o access token expira. */
  readonly expiresAt: number;
};

/** Lar do usuário (monitoramento de conta compartilhado). */
export type CurrentUserHousehold = {
  readonly id: string;
  readonly name: string;
};

/** Perfil do usuário autenticado, como a API devolve em `/api/v1/me`. */
export type CurrentUser = {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  /** `null` enquanto o usuário não participa de um lar. */
  readonly household: CurrentUserHousehold | null;
};

/** Sessão ativa no app: tokens + perfil já confirmado pela API. */
export type Session = {
  readonly tokens: AuthTokens;
  readonly user: CurrentUser;
};

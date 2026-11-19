import type { AuthTokens, CurrentUser, Session } from '../../domain/auth/session';
import type { DomainError } from '../../shared/domain-error';
import type { Result } from '../../shared/result';

/**
 * - `sign-in`: página de login do provedor.
 * - `sign-up`: abre direto o cadastro (OIDC `prompt=create`).
 */
export type AuthorizationMode = 'sign-in' | 'sign-up';

export type AuthorizationErrorCode =
  /** O usuário fechou a página de login. Não é erro para ele: só volta à tela de entrada. */
  | 'auth.cancelled'
  /** Provedor fora do ar, sem internet, `state` inválido ou troca do código recusada. */
  | 'auth.failed';
export type AuthorizationError = DomainError<AuthorizationErrorCode>;

/**
 * Porta para o provedor de identidade (OAuth2 Authorization Code + PKCE).
 * A implementação abre o navegador seguro do sistema; o app nunca vê a senha.
 */
export interface AuthGateway {
  authorize(options: {
    readonly mode: AuthorizationMode;
  }): Promise<Result<AuthTokens, AuthorizationError>>;
}

export type CurrentUserErrorCode = 'auth.profile-unavailable';
export type CurrentUserError = DomainError<CurrentUserErrorCode>;

/** Porta para buscar o perfil do usuário autenticado (`GET /api/v1/me`). */
export interface CurrentUserGateway {
  fetchCurrentUser(accessToken: string): Promise<Result<CurrentUser, CurrentUserError>>;
}

/**
 * Onde a sessão ativa fica guardada. No KAN-25 só em memória;
 * a persistência no Keystore (`TokenStorage`) entra no KAN-29.
 */
export interface SessionStore {
  current(): Session | null;
  save(session: Session): void;
  clear(): void;
  /** Avisa quando a sessão muda; devolve a função para cancelar a inscrição. */
  subscribe(listener: () => void): () => void;
}

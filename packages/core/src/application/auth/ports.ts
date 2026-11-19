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
 * Por que a sessão terminou:
 * - `signed-out`: o usuário tocou em "Sair";
 * - `expired`: a renovação foi recusada (refresh revogado ou sessão expirada no provedor).
 */
export type SessionEndReason = 'signed-out' | 'expired';

/**
 * Sessão ativa em memória, observável pela UI (guarda de rotas, saudação no Início).
 * A cópia persistente fica no `TokenStorage`; quem mantém as duas em sincronia é o `SessionManager`.
 */
export interface SessionStore {
  current(): Session | null;
  save(session: Session): void;
  clear(reason?: SessionEndReason): void;
  /** Motivo do último fim de sessão; volta a `null` quando uma nova sessão é salva. */
  endReason(): SessionEndReason | null;
  /** Avisa quando a sessão muda; devolve a função para cancelar a inscrição. */
  subscribe(listener: () => void): () => void;
}

/**
 * Armazenamento persistente e cifrado da sessão (no Android: Keystore via SecureStore).
 * Tokens nunca vão para AsyncStorage nem para logs.
 */
export interface TokenStorage {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}

export type TokenRefreshErrorCode =
  /** O provedor recusou o refresh token (revogado, rotacionado ou sessão expirada): é preciso entrar de novo. */
  | 'auth.session-expired'
  /** Sem internet ou provedor fora do ar: tentar de novo mais tarde, sem derrubar a sessão. */
  | 'auth.offline';
export type TokenRefreshError = DomainError<TokenRefreshErrorCode>;

/** Operações com tokens já emitidos (renovação e encerramento da sessão no provedor). */
export interface TokenGateway {
  refresh(refreshToken: string): Promise<Result<AuthTokens, TokenRefreshError>>;
  /**
   * Encerra a sessão no provedor, invalidando o refresh token.
   * Um token que o provedor já não reconhece conta como sucesso (não há mais o que revogar).
   */
  endSession(refreshToken: string): Promise<Result<void, DomainError<'auth.offline'>>>;
}

/** Refresh tokens que não puderam ser revogados (ex.: "Sair" sem internet), para tentar depois. */
export interface PendingRevocationQueue {
  add(refreshToken: string): Promise<void>;
  list(): Promise<readonly string[]>;
  remove(refreshToken: string): Promise<void>;
}

/** Relógio injetável (epoch em ms), para testar expiração sem esperar. */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

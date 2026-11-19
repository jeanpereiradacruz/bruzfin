import type { Session } from '../../domain/auth/session';
import { type DomainError, domainError } from '../../shared/domain-error';
import { err, ok, type Result } from '../../shared/result';
import type { UseCase } from '../use-case';
import type {
  AuthGateway,
  AuthorizationErrorCode,
  AuthorizationMode,
  CurrentUserErrorCode,
  CurrentUserGateway,
  SessionStore,
} from './ports';

export type SignInInput = { readonly mode: AuthorizationMode };

export type SignInErrorCode = AuthorizationErrorCode | CurrentUserErrorCode;
export type SignInError = DomainError<SignInErrorCode>;

/** Mensagens para o usuário: genéricas, sem detalhes técnicos nem se a conta existe. */
const messages: Record<SignInErrorCode, string> = {
  'auth.cancelled': 'Login cancelado.',
  'auth.failed': 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
  'auth.profile-unavailable': 'Não foi possível carregar seu perfil. Tente novamente.',
};

/**
 * Entrar (ou criar conta) pelo provedor de identidade:
 * 1. autoriza com Authorization Code + PKCE (navegador seguro do sistema);
 * 2. confirma o token na API buscando o perfil (`/me`);
 * 3. só então guarda a sessão — sem perfil, não há sessão.
 */
export class SignIn implements UseCase<SignInInput, Result<Session, SignInError>> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly users: CurrentUserGateway,
    private readonly sessions: SessionStore,
  ) {}

  async execute({ mode }: SignInInput): Promise<Result<Session, SignInError>> {
    const authorization = await this.auth.authorize({ mode });
    if (!authorization.ok) return err(toSignInError(authorization.error.code));

    const tokens = authorization.value;
    const user = await this.users.fetchCurrentUser(tokens.accessToken);
    if (!user.ok) return err(toSignInError(user.error.code));

    const session: Session = { tokens, user: user.value };
    this.sessions.save(session);
    return ok(session);
  }
}

const toSignInError = (code: SignInErrorCode): SignInError => domainError(code, messages[code]);

import type { CurrentUser } from '../../domain/auth/session';
import type { Household, HouseholdInvite } from '../../domain/household/household';
import type { DomainError } from '../../shared/domain-error';
import type { Result } from '../../shared/result';

export type HouseholdErrorCode =
  /** O lar automático ainda está sendo criado (logo depois do primeiro acesso). */
  | 'household.not-ready'
  | 'household.invalid-name'
  | 'household.invite-not-found'
  | 'household.invite-expired'
  | 'household.invite-already-used'
  | 'household.already-member'
  /** O lar atual do convidado tem outros membros ou dados próprios: não dá para trocar. */
  | 'household.guest-household-not-empty'
  | 'household.too-many-attempts'
  /** Sem internet, API fora do ar ou resposta inesperada. */
  | 'household.unavailable';
export type HouseholdError = DomainError<HouseholdErrorCode>;

/** Porta para a API do lar (`/api/v1/household`). */
export interface HouseholdGateway {
  get(): Promise<Result<Household, HouseholdError>>;
  rename(name: string): Promise<Result<Household, HouseholdError>>;
  createInvite(): Promise<Result<HouseholdInvite, HouseholdError>>;
  /** `code` já normalizado (`ABCD-EFGH`). */
  acceptInvite(code: string): Promise<Result<Household, HouseholdError>>;
}

/** Atualiza o perfil guardado na sessão (memória e Keystore), ex.: depois de trocar de lar. */
export interface SessionUserUpdater {
  updateUser(update: (user: CurrentUser) => CurrentUser): Promise<void>;
}

import type { CurrentUser } from '../../domain/auth/session';
import {
  type Household,
  type HouseholdInvite,
  normalizeInviteCode,
  validateHouseholdName,
} from '../../domain/household/household';
import { domainError } from '../../shared/domain-error';
import { err, isOk, type Result } from '../../shared/result';
import type { HouseholdError, HouseholdGateway, SessionUserUpdater } from './ports';

/**
 * Casos de uso do lar no app: ver, renomear, convidar e entrar com código.
 * Valida antes de ir à rede e mantém o lar da sessão (`CurrentUser.household`) igual ao da API.
 */
export class HouseholdService {
  constructor(
    private readonly gateway: HouseholdGateway,
    private readonly session: SessionUserUpdater,
  ) {}

  async load(): Promise<Result<Household, HouseholdError>> {
    return this.synced(await this.gateway.get());
  }

  async rename(rawName: string): Promise<Result<Household, HouseholdError>> {
    const name = validateHouseholdName(rawName);
    if (!isOk(name)) return name;
    return this.synced(await this.gateway.rename(name.value));
  }

  createInvite(): Promise<Result<HouseholdInvite, HouseholdError>> {
    return this.gateway.createInvite();
  }

  async acceptInvite(rawCode: string): Promise<Result<Household, HouseholdError>> {
    const code = normalizeInviteCode(rawCode);
    if (code === null) {
      return err(
        domainError(
          'household.invite-not-found',
          'Código inválido. Ele tem 8 letras e números, como ABCD-1234.',
        ),
      );
    }
    return this.synced(await this.gateway.acceptInvite(code));
  }

  private async synced(
    result: Result<Household, HouseholdError>,
  ): Promise<Result<Household, HouseholdError>> {
    if (isOk(result)) {
      const { id, name, role } = result.value;
      await this.session.updateUser(
        (user): CurrentUser => ({ ...user, household: { id, name, role } }),
      );
    }
    return result;
  }
}

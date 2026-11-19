import { getMe } from '@bruzfin/api-client';
import {
  type CurrentUser,
  type CurrentUserError,
  type CurrentUserGateway,
  domainError,
  err,
  ok,
  type Result,
} from '@bruzfin/core';

/** Adapter do `CurrentUserGateway` sobre o cliente gerado pelo orval (`GET /api/v1/me`). */
export class ApiCurrentUserGateway implements CurrentUserGateway {
  async fetchCurrentUser(accessToken: string): Promise<Result<CurrentUser, CurrentUserError>> {
    try {
      // Token explícito: a sessão ainda não existe enquanto o login não termina.
      const response = await getMe({ headers: { Authorization: `Bearer ${accessToken}` } });
      if (response.status !== 200) return unavailable();
      const { id, email, name, household } = response.data;
      return ok({
        id,
        email,
        name: name ?? null,
        household: household ? { id: household.id, name: household.name } : null,
      });
    } catch {
      return unavailable();
    }
  }
}

const unavailable = () =>
  err(domainError('auth.profile-unavailable', 'Não foi possível carregar o perfil.'));

import {
  acceptHouseholdInvite,
  createHouseholdInvite,
  getHousehold,
  type Household as HouseholdDto,
  renameHousehold,
} from '@bruzfin/api-client';
import {
  domainError,
  err,
  type Household,
  type HouseholdError,
  type HouseholdErrorCode,
  type HouseholdGateway,
  type HouseholdInvite,
  ok,
  type Result,
} from '@bruzfin/core';

const MESSAGES: Record<HouseholdErrorCode, string> = {
  'household.not-ready': 'Seu lar ainda está sendo preparado. Tente de novo em instantes.',
  'household.invalid-name': 'O nome do lar precisa ter de 1 a 60 caracteres.',
  'household.invite-not-found': 'Código não encontrado. Confira as letras e os números.',
  'household.invite-expired': 'Este convite venceu. Peça um código novo para quem convidou você.',
  'household.invite-already-used': 'Este convite já foi usado. Peça um código novo.',
  'household.already-member': 'Você já faz parte deste lar.',
  'household.guest-household-not-empty':
    'Seu lar atual já tem outros membros ou dados, então não dá para entrar em outro.',
  'household.too-many-attempts': 'Muitas tentativas com código errado. Aguarde e tente de novo.',
  'household.unavailable': 'Não foi possível falar com o BruzFin. Verifique sua conexão.',
};

/** `code` dos Problem Details da API → erro do app. */
const API_CODES: Record<string, HouseholdErrorCode> = {
  'household.household-not-ready': 'household.not-ready',
  'household.invalid-name': 'household.invalid-name',
  'household.invite-not-found': 'household.invite-not-found',
  'household.invite-expired': 'household.invite-expired',
  'household.invite-already-used': 'household.invite-already-used',
  'household.already-member': 'household.already-member',
  'household.guest-household-not-empty': 'household.guest-household-not-empty',
  'household.too-many-attempts': 'household.too-many-attempts',
};

const failure = (code: HouseholdErrorCode, message = MESSAGES[code]) =>
  err(domainError(code, message));

type ApiResult = { readonly status: number; readonly data: unknown; readonly headers: Headers };

const toError = (response: ApiResult): Result<never, HouseholdError> => {
  const apiCode =
    typeof response.data === 'object' && response.data !== null && 'code' in response.data
      ? String((response.data as { code: unknown }).code)
      : '';
  const code = API_CODES[apiCode] ?? 'household.unavailable';
  if (code === 'household.too-many-attempts') {
    const seconds = Number(response.headers.get('Retry-After'));
    if (Number.isFinite(seconds) && seconds > 0) {
      const minutes = Math.ceil(seconds / 60);
      return failure(
        code,
        `Muitas tentativas com código errado. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
      );
    }
  }
  return failure(code);
};

const toHousehold = (dto: HouseholdDto): Household => ({
  id: dto.id,
  name: dto.name,
  role: dto.role,
  members: dto.members.map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name ?? null,
    role: m.role,
    joinedAt: m.joinedAt,
  })),
});

const call = async <T>(
  request: () => Promise<ApiResult>,
  successStatus: number,
  convert: (data: never) => T,
): Promise<Result<T, HouseholdError>> => {
  try {
    const response = await request();
    return response.status === successStatus
      ? ok(convert(response.data as never))
      : toError(response);
  } catch {
    return failure('household.unavailable');
  }
};

/** Adapter do `HouseholdGateway` sobre o cliente gerado pelo orval (`/api/v1/household`). */
export class ApiHouseholdGateway implements HouseholdGateway {
  get(): Promise<Result<Household, HouseholdError>> {
    return call(() => getHousehold(), 200, toHousehold);
  }

  rename(name: string): Promise<Result<Household, HouseholdError>> {
    return call(() => renameHousehold({ name }), 200, toHousehold);
  }

  createInvite(): Promise<Result<HouseholdInvite, HouseholdError>> {
    return call(
      () => createHouseholdInvite(),
      201,
      (data: { code: string; expiresAt: string }): HouseholdInvite => ({
        code: data.code,
        expiresAt: Date.parse(data.expiresAt),
      }),
    );
  }

  acceptInvite(code: string): Promise<Result<Household, HouseholdError>> {
    return call(() => acceptHouseholdInvite({ code }), 200, toHousehold);
  }
}

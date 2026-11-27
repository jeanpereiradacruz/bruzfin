import { type DomainError, domainError } from '../../shared/domain-error';
import { err, ok, type Result } from '../../shared/result';

/** Quem criou o lar (`OWNER`) ou quem entrou por convite (`MEMBER`). */
export type HouseholdRole = 'OWNER' | 'MEMBER';

export type HouseholdMember = {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly role: HouseholdRole;
  /** ISO 8601. */
  readonly joinedAt: string;
};

/** Lar do usuário (monitoramento de conta compartilhado), com os membros por ordem de entrada. */
export type Household = {
  readonly id: string;
  readonly name: string;
  /** Papel do usuário autenticado. */
  readonly role: HouseholdRole;
  readonly members: readonly HouseholdMember[];
};

/** Código recém-gerado: só aparece agora (a API guarda apenas o hash). */
export type HouseholdInvite = {
  /** `ABCD-EFGH`. */
  readonly code: string;
  /** Epoch em ms. */
  readonly expiresAt: number;
};

export const HOUSEHOLD_NAME_MAX_LENGTH = 60;

/** Mesma regra da API: sem espaços sobrando, de 1 a 60 caracteres. */
export const validateHouseholdName = (
  raw: string,
): Result<string, DomainError<'household.invalid-name'>> => {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length === 0 || name.length > HOUSEHOLD_NAME_MAX_LENGTH) {
    return err(
      domainError('household.invalid-name', 'O nome do lar precisa ter de 1 a 60 caracteres.'),
    );
  }
  return ok(name);
};

const INVITE_ALPHABET = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/**
 * Lê o código como a API: ignora hífen, espaços e caixa e aceita O no lugar de 0 e I/L no lugar de 1.
 * Devolve `ABCD-EFGH` ou `null` se não tiver o formato de um código.
 */
export const normalizeInviteCode = (raw: string): string | null => {
  const code = raw.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return INVITE_ALPHABET.test(code) ? `${code.slice(0, 4)}-${code.slice(4)}` : null;
};

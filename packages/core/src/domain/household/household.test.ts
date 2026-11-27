import { describe, expect, it } from 'vitest';
import { isErr, unwrapOr } from '../../shared/result';
import { normalizeInviteCode, validateHouseholdName } from './household';

describe('validateHouseholdName', () => {
  it('tira espaços sobrando', () => {
    expect(unwrapOr(validateHouseholdName('  Casa   da praia '), '')).toBe('Casa da praia');
  });

  it.each(['', '   ', 'a'.repeat(61)])('recusa "%s"', (name) => {
    expect(isErr(validateHouseholdName(name))).toBe(true);
  });

  it('aceita exatamente 60 caracteres', () => {
    expect(unwrapOr(validateHouseholdName('a'.repeat(60)), '')).toHaveLength(60);
  });
});

describe('normalizeInviteCode', () => {
  it.each(['ABCD-1230', 'abcd1230', ' abcd 1230 ', 'ABCD-I23O', 'abcd-l23o'])(
    'lê "%s" como ABCD-1230',
    (typed) => {
      expect(normalizeInviteCode(typed)).toBe('ABCD-1230');
    },
  );

  it.each(['', 'ABC-123', 'ABCD-12345', 'ABCD-123U', 'ABCD-12#4'])('recusa "%s"', (typed) => {
    expect(normalizeInviteCode(typed)).toBeNull();
  });
});

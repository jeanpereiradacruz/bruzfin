import { describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../../domain/auth/session';
import type { Household } from '../../domain/household/household';
import { domainError } from '../../shared/domain-error';
import { err, ok } from '../../shared/result';
import { HouseholdService } from './household-service';
import type { HouseholdGateway, SessionUserUpdater } from './ports';

const household: Household = {
  id: 'lar-1',
  name: 'Lar de Usuário',
  role: 'MEMBER',
  members: [
    {
      id: 'u-1',
      email: 'usuario@bruzfin.local',
      name: 'Usuário de Teste',
      role: 'OWNER',
      joinedAt: '2026-11-27T12:00:00Z',
    },
  ],
};

const user: CurrentUser = {
  id: 'u-2',
  email: 'convidado@bruzfin.local',
  name: 'Pessoa Convidada',
  household: { id: 'lar-antigo', name: 'Lar de Pessoa', role: 'OWNER' },
};

const setup = (overrides: Partial<HouseholdGateway> = {}) => {
  const gateway: HouseholdGateway = {
    get: vi.fn(async () => ok(household)),
    rename: vi.fn(async (name: string) => ok({ ...household, name })),
    createInvite: vi.fn(async () => ok({ code: 'ABCD-1230', expiresAt: 1 })),
    acceptInvite: vi.fn(async () => ok(household)),
    ...overrides,
  };
  let current = user;
  const session: SessionUserUpdater = {
    updateUser: vi.fn(async (update) => {
      current = update(current);
    }),
  };
  return { service: new HouseholdService(gateway, session), gateway, session, user: () => current };
};

describe('HouseholdService', () => {
  it('ao carregar, deixa o lar da sessão igual ao da API', async () => {
    const { service, user: current } = setup();

    const result = await service.load();

    expect(result).toEqual(ok(household));
    expect(current().household).toEqual({ id: 'lar-1', name: 'Lar de Usuário', role: 'MEMBER' });
  });

  it('renomeia com o nome já normalizado', async () => {
    const { service, gateway, user: current } = setup();

    await service.rename('  Casa   da praia ');

    expect(gateway.rename).toHaveBeenCalledWith('Casa da praia');
    expect(current().household?.name).toBe('Casa da praia');
  });

  it('não vai à rede com nome inválido', async () => {
    const { service, gateway } = setup();

    const result = await service.rename('   ');

    expect(result.ok).toBe(false);
    expect(gateway.rename).not.toHaveBeenCalled();
  });

  it('entra com o código normalizado e atualiza o lar da sessão', async () => {
    const { service, gateway, user: current } = setup();

    await service.acceptInvite(' abcd i23o ');

    expect(gateway.acceptInvite).toHaveBeenCalledWith('ABCD-1230');
    expect(current().household?.id).toBe('lar-1');
  });

  it('código fora do formato nem vai à rede', async () => {
    const { service, gateway } = setup();

    const result = await service.acceptInvite('123');

    expect(result).toEqual(
      err(
        domainError(
          'household.invite-not-found',
          'Código inválido. Ele tem 8 letras e números, como ABCD-1234.',
        ),
      ),
    );
    expect(gateway.acceptInvite).not.toHaveBeenCalled();
  });

  it('se a API recusar, a sessão continua com o lar antigo', async () => {
    const {
      service,
      session,
      user: current,
    } = setup({
      acceptInvite: vi.fn(async () =>
        err(domainError('household.invite-expired', 'Este convite venceu. Peça um código novo.')),
      ),
    });

    const result = await service.acceptInvite('ABCD-1230');

    expect(result.ok).toBe(false);
    expect(session.updateUser).not.toHaveBeenCalled();
    expect(current().household?.id).toBe('lar-antigo');
  });

  it('gerar convite não mexe na sessão', async () => {
    const { service, session } = setup();

    expect(await service.createInvite()).toEqual(ok({ code: 'ABCD-1230', expiresAt: 1 }));
    expect(session.updateUser).not.toHaveBeenCalled();
  });
});

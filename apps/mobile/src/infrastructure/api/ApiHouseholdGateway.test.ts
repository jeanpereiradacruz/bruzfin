import { configureApiClient } from '@bruzfin/api-client';
import { ApiHouseholdGateway } from './ApiHouseholdGateway';

const household = {
  id: 'lar-1',
  name: 'Lar de Usuário',
  role: 'OWNER',
  members: [
    {
      id: 'u-1',
      email: 'usuario@bruzfin.local',
      role: 'OWNER',
      joinedAt: '2026-11-27T12:00:00Z',
    },
  ],
};

const respond = (status: number, body: unknown, headers: Record<string, string> = {}) => {
  const fetchMock = jest.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
      }),
  );
  configureApiClient({
    baseUrl: 'http://localhost:8080',
    getAccessToken: () => 'token',
    fetch: fetchMock as unknown as typeof fetch,
  });
  return fetchMock;
};

const problem = (status: number, code: string) => ({
  type: 'about:blank',
  title: 'Erro',
  status,
  detail: 'texto da API',
  code,
});

describe('ApiHouseholdGateway', () => {
  const gateway = new ApiHouseholdGateway();

  it('busca o lar e converte os membros (nome ausente vira null)', async () => {
    const fetchMock = respond(200, household);

    const result = await gateway.get();

    expect(result).toEqual({
      ok: true,
      value: {
        ...household,
        members: [{ ...household.members[0], name: null }],
      },
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8080/api/v1/household');
  });

  it('renomeia com PATCH', async () => {
    const fetchMock = respond(200, { ...household, name: 'Casa' });

    const result = await gateway.rename('Casa');

    expect(result.ok && result.value.name).toBe('Casa');
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ name: 'Casa' }));
  });

  it('gera convite (201) com a validade em epoch', async () => {
    respond(201, { code: 'ABCD-1230', expiresAt: '2026-11-29T12:00:00Z' });

    expect(await gateway.createInvite()).toEqual({
      ok: true,
      value: { code: 'ABCD-1230', expiresAt: Date.parse('2026-11-29T12:00:00Z') },
    });
  });

  it('aceita o convite', async () => {
    const fetchMock = respond(200, household);

    const result = await gateway.acceptInvite('ABCD-1230');

    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8080/api/v1/household/invites/accept',
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ code: 'ABCD-1230' }));
  });

  it.each([
    [404, 'household.invite-not-found', 'household.invite-not-found'],
    [410, 'household.invite-expired', 'household.invite-expired'],
    [409, 'household.invite-already-used', 'household.invite-already-used'],
    [409, 'household.already-member', 'household.already-member'],
    [409, 'household.guest-household-not-empty', 'household.guest-household-not-empty'],
    [409, 'household.household-not-ready', 'household.not-ready'],
    [503, 'household.attempts-unavailable', 'household.unavailable'],
    [500, '', 'household.unavailable'],
  ])('%i com code "%s" vira %s, com mensagem do app', async (status, apiCode, code) => {
    respond(status, problem(status, apiCode));

    const result = await gateway.acceptInvite('ABCD-1230');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(code);
      expect(result.error.message).not.toBe('texto da API');
    }
  });

  it('muitas tentativas: diz quanto falta pelo Retry-After', async () => {
    respond(429, problem(429, 'household.too-many-attempts'), { 'Retry-After': '720' });

    const result = await gateway.acceptInvite('ABCD-1230');

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'household.too-many-attempts',
        message: 'Muitas tentativas com código errado. Tente de novo em 12 minutos.',
      },
    });
  });

  it('sem rede vira indisponível', async () => {
    configureApiClient({
      baseUrl: 'http://localhost:8080',
      fetch: (async () => {
        throw new TypeError('Network request failed');
      }) as unknown as typeof fetch,
    });

    const result = await gateway.get();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('household.unavailable');
  });
});

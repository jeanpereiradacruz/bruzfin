import { configureApiClient } from '@bruzfin/api-client';
import { ApiCurrentUserGateway } from './ApiCurrentUserGateway';

const respond = (status: number, body: unknown) =>
  jest.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );

describe('ApiCurrentUserGateway', () => {
  it('busca /me com o token recebido e converte o perfil', async () => {
    const fetchMock = respond(200, {
      id: '019a0000-0000-7000-8000-000000000001',
      email: 'usuario@bruzfin.local',
      name: 'Usuário de Teste',
    });
    configureApiClient({
      baseUrl: 'http://localhost:8080',
      getAccessToken: () => 'token-antigo',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await new ApiCurrentUserGateway().fetchCurrentUser('token-novo');

    expect(result).toEqual({
      ok: true,
      value: {
        id: '019a0000-0000-7000-8000-000000000001',
        email: 'usuario@bruzfin.local',
        name: 'Usuário de Teste',
        household: null,
      },
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:8080/api/v1/me');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-novo');
  });

  it('resposta diferente de 200 vira perfil indisponível', async () => {
    configureApiClient({
      baseUrl: 'http://localhost:8080',
      fetch: respond(401, { status: 401, title: 'Não autenticado' }) as unknown as typeof fetch,
    });
    const result = await new ApiCurrentUserGateway().fetchCurrentUser('token');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth.profile-unavailable');
  });

  it('falha de rede vira perfil indisponível', async () => {
    configureApiClient({
      baseUrl: 'http://localhost:8080',
      fetch: jest.fn(async () => {
        throw new TypeError('Network request failed');
      }),
    });
    const result = await new ApiCurrentUserGateway().fetchCurrentUser('token');
    expect(result.ok).toBe(false);
  });
});

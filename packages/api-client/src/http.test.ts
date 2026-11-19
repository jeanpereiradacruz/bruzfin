import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMe } from './generated/bruzfin-api';
import { configureApiClient, resetApiClient } from './http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cliente da API', () => {
  afterEach(() => resetApiClient());

  it('chama a URL base com o token Bearer e devolve status e dados', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { id: '0190f0b0-0000-7000-8000-000000000001', email: 'a@bruzfin.local' }),
    );
    configureApiClient({
      baseUrl: 'http://localhost:8080//',
      getAccessToken: async () => 'token-123',
      fetch: fetchMock,
    });

    const response = await getMe();

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.data.email).toBe('a@bruzfin.local');
    }
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/v1/me');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-123');
  });

  it('sem token, não envia Authorization', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(401, { status: 401, title: 'Não autenticado' }),
    );
    configureApiClient({ baseUrl: 'http://localhost:8080', fetch: fetchMock });

    const response = await getMe();

    expect(response.status).toBe(401);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
  });

  it('mantém o Authorization explícito da chamada sem consultar o provedor', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { id: 'x', email: 'a@bruzfin.local' }));
    const getAccessToken = vi.fn(() => 'token-da-sessao');
    configureApiClient({ baseUrl: 'http://localhost:8080', getAccessToken, fetch: fetchMock });

    await getMe({ headers: { Authorization: 'Bearer token-novo' } });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-novo');
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it('falha com mensagem clara se o app esquecer de configurar', async () => {
    await expect(getMe()).rejects.toThrow('configureApiClient');
  });
});

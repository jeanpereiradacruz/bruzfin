/**
 * Transporte HTTP usado por todo o cliente gerado (mutator do orval).
 * Não conhece React nem Expo: o app injeta a URL base e de onde vem o access token.
 * Em 401, pede um token novo ao app (`onUnauthorized`, que renova em single-flight) e repete uma vez.
 */

export type AccessTokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export interface ApiClientConfig {
  /** Ex.: `http://localhost:8080` no emulador (com `adb reverse tcp:8080 tcp:8080`). */
  baseUrl: string;
  /** Devolve o access token atual; sem token, a requisição vai sem `Authorization`. */
  getAccessToken?: AccessTokenProvider;
  /**
   * Chamado quando a API responde 401 a uma requisição que usou o token do `getAccessToken`.
   * Devolve um token novo para repetir a requisição uma única vez, ou `null` para desistir.
   */
  onUnauthorized?: (rejectedToken: string) => Promise<string | null | undefined>;
  /** Permite trocar o fetch (testes). Padrão: o `fetch` global. */
  fetch?: typeof fetch;
}

/** Resposta de toda operação gerada: o status decide qual `data` veio. */
export interface ApiResponse<TData> {
  status: number;
  data: TData;
  headers: Headers;
}

let current: ApiClientConfig | undefined;

export function configureApiClient(config: ApiClientConfig): void {
  current = { ...config, baseUrl: withoutTrailingSlashes(config.baseUrl) };
}

function withoutTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') {
    end--;
  }
  return url.slice(0, end);
}

/** Só para testes. */
export function resetApiClient(): void {
  current = undefined;
}

const NO_BODY = new Set([204, 205, 304]);

export async function bruzfinFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (current === undefined) {
    throw new Error(
      'Cliente da API não configurado: chame configureApiClient() na inicialização do app.',
    );
  }
  const config = current;
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json, application/problem+json');
  // Um Authorization explícito vence o provedor (ex.: buscar o /me com o token recém-emitido no login).
  let providedToken: string | null = null;
  if (!headers.has('Authorization')) {
    const token = await config.getAccessToken?.();
    if (token) {
      providedToken = token;
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const doFetch = config.fetch ?? fetch;
  const send = () => doFetch(`${config.baseUrl}${url}`, { ...options, headers });
  let response = await send();

  if (response.status === 401 && providedToken && config.onUnauthorized) {
    const renewed = await config.onUnauthorized(providedToken);
    if (renewed && renewed !== providedToken) {
      headers.set('Authorization', `Bearer ${renewed}`);
      response = await send();
    }
  }

  const text = NO_BODY.has(response.status) ? '' : await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  const result: ApiResponse<unknown> = { status: response.status, data, headers: response.headers };
  return result as T;
}

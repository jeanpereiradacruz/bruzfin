/**
 * Transporte HTTP usado por todo o cliente gerado (mutator do orval).
 * Não conhece React nem Expo: o app injeta a URL base e de onde vem o access token.
 * A renovação automática do token (single-flight) entra aqui no KAN-29.
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
  current = { ...config, baseUrl: config.baseUrl.replace(/\/+$/, '') };
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
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json, application/problem+json');
  const token = await current.getAccessToken?.();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = current.fetch ?? fetch;
  const response = await doFetch(`${current.baseUrl}${url}`, { ...options, headers });
  const text = NO_BODY.has(response.status) ? '' : await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  const result: ApiResponse<unknown> = { status: response.status, data, headers: response.headers };
  return result as T;
}

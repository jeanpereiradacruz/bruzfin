import { z } from 'zod';

/** Redirect do Authorization Code. Precisa bater com o `scheme` do app.json e o client do realm. */
export const AUTH_REDIRECT_URI = 'bruzfin://auth/callback';

/** Valores do ambiente local (Docker Compose + `adb reverse`). Só usados em desenvolvimento. */
const localDefaults = {
  apiUrl: 'http://localhost:8080',
  authIssuer: 'http://localhost:8180/realms/bruzfin',
  authClientId: 'bruzfin-mobile',
} as const;

const schema = z.object({
  apiUrl: z.url({ protocol: /^https?$/ }),
  authIssuer: z.url({ protocol: /^https?$/ }),
  authClientId: z.string().min(1),
});

export type AppConfig = z.infer<typeof schema>;

type RawEnv = {
  readonly EXPO_PUBLIC_API_URL?: string | undefined;
  readonly EXPO_PUBLIC_AUTH_ISSUER?: string | undefined;
  readonly EXPO_PUBLIC_AUTH_CLIENT_ID?: string | undefined;
};

/**
 * Lê e valida a configuração pública do app (variáveis `EXPO_PUBLIC_*`, embutidas no bundle:
 * nunca coloque segredo nelas). Fora do desenvolvimento, todas são obrigatórias e precisam ser HTTPS,
 * para um build de release não apontar sem querer para `localhost`.
 */
export function parseAppConfig(env: RawEnv, isDevelopment: boolean): AppConfig {
  const fallback = isDevelopment ? localDefaults : undefined;
  const config = schema.parse({
    apiUrl: env.EXPO_PUBLIC_API_URL || fallback?.apiUrl,
    authIssuer: env.EXPO_PUBLIC_AUTH_ISSUER || fallback?.authIssuer,
    authClientId: env.EXPO_PUBLIC_AUTH_CLIENT_ID || fallback?.authClientId,
  });
  if (!isDevelopment) {
    for (const url of [config.apiUrl, config.authIssuer]) {
      if (!url.startsWith('https://')) {
        throw new Error(`Configuração inválida: em release as URLs precisam ser HTTPS (${url}).`);
      }
    }
  }
  return config;
}

export const readAppConfig = (): AppConfig =>
  parseAppConfig(
    {
      // O Expo só embute EXPO_PUBLIC_* com acesso estático (process.env.NOME).
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_AUTH_ISSUER: process.env.EXPO_PUBLIC_AUTH_ISSUER,
      EXPO_PUBLIC_AUTH_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH_CLIENT_ID,
    },
    __DEV__,
  );

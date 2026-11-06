# @bruzfin/api-client

Cliente HTTP da API do BruzFin, **gerado pelo [orval](https://orval.dev)** a partir do contrato OpenAPI. Não edite `src/generated/` à mão.

```ts
import { configureApiClient, getMe } from '@bruzfin/api-client';

configureApiClient({
  baseUrl: 'http://localhost:8080', // no emulador: adb reverse tcp:8080 tcp:8080
  getAccessToken: () => session.accessToken, // o app injeta de onde vem o token
});

const response = await getMe();
if (response.status === 200)
  response.data.email; // tipado: Me
else response.data.title; // 401/403/429: Problem (RFC 9457)
```

- `src/http.ts` é o transporte (mutator do orval): URL base, cabeçalho `Authorization: Bearer` e leitura da resposta. Não depende de React nem Expo. A renovação automática do token entra aqui no KAN-29.
- `openapi.json` é o contrato publicado pela API (`services/api`).

## Quando a API muda

```bash
cd services/api && ./mvnw verify -Dbruzfin.openapi.update=true   # regrava openapi.json
pnpm --filter @bruzfin/api-client generate                        # regera src/generated
```

O CI falha se o `openapi.json` não bater com a API (teste `BruzfinApiApplicationIT`) ou se o código gerado não bater com o `openapi.json` (workflow Mobile).

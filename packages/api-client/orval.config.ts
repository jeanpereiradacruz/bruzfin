import { defineConfig } from 'orval';

/**
 * Gera o cliente a partir do contrato publicado pela API (services/api).
 * O contrato é atualizado pelo teste BruzfinApiApplicationIT; depois, `pnpm generate`.
 */
export default defineConfig({
  bruzfin: {
    input: { target: './openapi.json' },
    output: {
      target: './src/generated/bruzfin-api.ts',
      client: 'fetch',
      mode: 'single',
      override: {
        mutator: { path: './src/http.ts', name: 'bruzfinFetch' },
      },
    },
  },
});

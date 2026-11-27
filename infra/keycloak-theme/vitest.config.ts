import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Sem o plugin do Keycloakify: os testes renderizam as telas com contextos falsos (src/login/mocks.ts).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    css: false,
  },
});

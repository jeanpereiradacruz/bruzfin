import react from '@vitejs/plugin-react';
import { keycloakify } from 'keycloakify/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    keycloakify({
      themeName: 'bruzfin',
      accountThemeImplementation: 'none',
      // Só o Keycloak 26 (compose e nuvem): um único .jar.
      keycloakVersionTargets: {
        '22-to-25': false,
        'all-other-versions': 'bruzfin-theme.jar',
      },
    }),
  ],
});

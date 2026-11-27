// Copia o .jar gerado pelo Keycloakify para providers/, a pasta montada no Keycloak do compose.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const source = new URL('../dist_keycloak/bruzfin-theme.jar', import.meta.url);
const target = new URL('../providers/bruzfin-theme.jar', import.meta.url);

if (!existsSync(source)) {
  console.error('dist_keycloak/bruzfin-theme.jar não encontrado: rode o keycloakify build antes.');
  process.exit(1);
}
mkdirSync(new URL('../providers/', import.meta.url), { recursive: true });
copyFileSync(source, target);
console.warn('Tema copiado para providers/bruzfin-theme.jar');

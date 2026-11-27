import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KcPage } from './kc.gen';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

/**
 * No Keycloak, `window.kcContext` vem do servidor. Em `pnpm dev`, escolha a tela pela URL:
 * http://localhost:5173/?page=register.ftl (o mock fica fora do bundle do tema).
 */
async function start() {
  if (import.meta.env.DEV && !window.kcContext) {
    const { devKcContext } = await import('./login/mocks');
    window.kcContext = devKcContext(new URLSearchParams(window.location.search));
  }
  createRoot(root as HTMLElement).render(
    <StrictMode>{window.kcContext ? <KcPage kcContext={window.kcContext} /> : null}</StrictMode>,
  );
}

void start();

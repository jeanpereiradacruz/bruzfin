import { isAuthCallback } from '../infrastructure/auth/authCallback';

/**
 * Deep links que chegam ao app antes do Expo Router.
 * `bruzfin://auth/callback` é o retorno do Keycloak: quem trata é o expo-auth-session (que espera
 * esse link para concluir o login). Para o router, ele só aponta para a tela de entrada — sem isso,
 * apareceria "rota não encontrada" por baixo do navegador.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return isAuthCallback(path) ? '/entrar' : path;
}

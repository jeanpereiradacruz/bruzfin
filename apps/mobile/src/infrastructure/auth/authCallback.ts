import { AUTH_REDIRECT_URI } from '../config/env';

const CALLBACK_PATH = AUTH_REDIRECT_URI.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // "auth/callback"

/** Indica se o link (completo ou só o caminho) é o retorno do login (`bruzfin://auth/callback`). */
export const isAuthCallback = (path: string): boolean => {
  const withoutScheme = path.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\/+/, '');
  if (!withoutScheme.startsWith(CALLBACK_PATH)) return false;
  const next = withoutScheme.charAt(CALLBACK_PATH.length);
  return next === '' || next === '?' || next === '#' || next === '/';
};

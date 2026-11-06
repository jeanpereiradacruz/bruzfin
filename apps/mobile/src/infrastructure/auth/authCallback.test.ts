import { isAuthCallback } from './authCallback';

describe('isAuthCallback', () => {
  it.each([
    'bruzfin://auth/callback?code=abc&state=xyz',
    'bruzfin://auth/callback',
    '/auth/callback?code=abc',
    'auth/callback#x',
  ])('reconhece o retorno do login: %s', (path) => {
    expect(isAuthCallback(path)).toBe(true);
  });

  it.each(['/', '/contas', 'bruzfin://auth/callbacks', 'bruzfin://nova-compra'])(
    'deixa outros links com o router: %s',
    (path) => {
      expect(isAuthCallback(path)).toBe(false);
    },
  );
});

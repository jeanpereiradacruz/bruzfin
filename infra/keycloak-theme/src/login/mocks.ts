import { createGetKcContextMock } from 'keycloakify/login/KcContext';
import { kcEnvDefaults, themeNames } from '../kc.gen';
import type { KcContext, KcContextExtension, KcContextExtensionPerPage } from './KcContext';

const kcContextExtension: KcContextExtension = {
  themeName: themeNames[0] ?? 'bruzfin',
  properties: { ...kcEnvDefaults },
};

/** Contextos falsos do Keycloak (realm bruzfin em pt-BR), para testes e para o `pnpm dev`. */
export const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension,
  kcContextExtensionPerPage: {} as KcContextExtensionPerPage,
  overrides: {
    locale: { currentLanguageTag: 'pt-BR' },
    realm: { displayName: 'BruzFin', registrationEmailAsUsername: true },
  },
  overridesPerPage: {},
});

export function devKcContext(params: URLSearchParams): KcContext {
  const pageId = (params.get('page') ?? 'login.ftl') as KcContext['pageId'];
  return getKcContextMock({ pageId, overrides: {} });
}

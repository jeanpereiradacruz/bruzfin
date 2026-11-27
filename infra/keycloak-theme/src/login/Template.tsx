import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './styles.css';
import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import type { TemplateProps } from 'keycloakify/login/TemplateProps';
import { useEffect } from 'react';
import { Logo } from './components/Logo';
import type { I18n } from './i18n';
import type { KcContext } from './KcContext';
import { themeCss } from './themeCss';

/**
 * Moldura de todas as telas: logo, título, aviso do Keycloak e rodapé (design "App · Login e cadastro").
 * Fontes empacotadas no tema (@fontsource): nada vem de CDN.
 */
export default function Template(props: TemplateProps<KcContext, I18n>) {
  const {
    kcContext,
    i18n,
    children,
    headerNode,
    socialProvidersNode,
    infoNode,
    displayMessage = true,
    documentTitle,
  } = props;
  const { msgStr, currentLanguage } = i18n;
  const { message, isAppInitiatedAction } = kcContext;

  useEffect(() => {
    document.title = documentTitle ?? msgStr('loginTitle');
    document.documentElement.lang = currentLanguage.languageTag;
  }, [documentTitle, msgStr, currentLanguage.languageTag]);

  const showMessage =
    displayMessage &&
    message !== undefined &&
    (message.type !== 'warning' || !isAppInitiatedAction);

  return (
    <>
      <style>{themeCss}</style>
      <div className="bf-page">
        <header className="bf-brand">
          <Logo />
          <span className="bf-brand__name" aria-hidden="true">
            BruzFin
          </span>
          <span className="bf-brand__tagline">{msgStr('bruzfinTagline')}</span>
        </header>

        <main className="bf-main">
          <h1 className="bf-title">{headerNode}</h1>
          {showMessage ? (
            <p
              className={`bf-alert bf-alert--${message.type}`}
              role={message.type === 'error' ? 'alert' : 'status'}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: mensagem do Keycloak, sanitizada como no tema padrão.
              dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }}
            />
          ) : null}
          {children}
          {socialProvidersNode}
        </main>

        {infoNode ? <footer className="bf-footer">{infoNode}</footer> : null}
      </div>
    </>
  );
}

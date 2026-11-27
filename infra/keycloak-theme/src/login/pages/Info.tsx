import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'info.ftl' }>, I18n>;

/** Avisos do Keycloak (email confirmado, senha trocada...), com o próximo passo. */
export default function Info({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { message, messageHeader, requiredActions, skipLink, pageRedirectUri, actionUri, client } =
    kcContext;
  const { msg, msgStr, advancedMsgStr } = i18n;

  const next = (() => {
    if (skipLink) return null;
    if (pageRedirectUri) return { href: pageRedirectUri, label: msgStr('bruzfinContinue') };
    if (actionUri) return { href: actionUri, label: msgStr('bruzfinContinue') };
    if (client.baseUrl) return { href: client.baseUrl, label: msgStr('bruzfinBackToLogin') };
    return null;
  })();

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      displayMessage={false}
      headerNode={messageHeader ? advancedMsgStr(messageHeader) : msg('bruzfinAllSet')}
    >
      {messageHeader || message.summary ? (
        <p
          className="bf-subtitle"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: mensagem do Keycloak, sanitizada como no tema padrão.
          dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }}
        />
      ) : null}
      {requiredActions && requiredActions.length > 0 ? (
        <p className="bf-subtitle">
          {msg(
            'bruzfinRequiredActions',
            requiredActions.map((action) => advancedMsgStr(`requiredAction.${action}`)).join(', '),
          )}
        </p>
      ) : null}
      {next ? (
        <a className="bf-button bf-button--primary" href={next.href}>
          {next.label}
        </a>
      ) : (
        // Link do email aberto fora do app: não há para onde voltar aqui.
        <p className="bf-notice">{msg('bruzfinBackToApp')}</p>
      )}
    </Template>
  );
}

import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'error.ftl' }>, I18n>;

const EXPIRED_KEYS = [
  'expiredActionMessage',
  'expiredActionTokenNoSessionMessage',
  'expiredActionTokenSessionExistsMessage',
  'expiredCodeMessage',
] as const;

/** Erros do Keycloak; link vencido ou já usado vira a tela "Link expirado". */
export default function ErrorPage({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { message, client, skipLink, url } = kcContext;
  const { msg, msgStr } = i18n;
  const expired = EXPIRED_KEYS.some((key) => msgStr(key) === message.summary);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      displayMessage={false}
      headerNode={msg(expired ? 'bruzfinExpiredTitle' : 'bruzfinErrorTitle')}
    >
      {expired ? (
        <p className="bf-subtitle" role="alert">
          {msg('bruzfinExpiredBody')}
        </p>
      ) : (
        <p
          className="bf-subtitle"
          role="alert"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: mensagem do Keycloak, sanitizada como no tema padrão.
          dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }}
        />
      )}
      {!skipLink ? (
        <a className="bf-button bf-button--primary" href={client?.baseUrl || url.loginUrl}>
          {msg('bruzfinBackToLogin')}
        </a>
      ) : null}
    </Template>
  );
}

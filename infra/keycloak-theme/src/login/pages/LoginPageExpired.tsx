import type { PageProps } from 'keycloakify/login/pages/PageProps';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login-page-expired.ftl' }>, I18n>;

export default function LoginPageExpired({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url } = kcContext;
  const { msg } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msg('pageExpiredTitle')}
    >
      <p className="bf-subtitle">{msg('bruzfinExpiredBody')}</p>
      <a className="bf-button bf-button--primary" href={url.loginRestartFlowUrl}>
        {msg('bruzfinBackToLogin')}
      </a>
      <a className="bf-link bf-link--center" href={url.loginAction}>
        {msg('bruzfinContinue')}
      </a>
    </Template>
  );
}

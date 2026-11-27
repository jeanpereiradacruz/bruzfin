import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { EnvelopeIcon } from '../components/fields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login-verify-email.ftl' }>, I18n>;

/** Depois do cadastro: "Confira seu email", com reenvio. */
export default function LoginVerifyEmail({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url, user } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      displayMessage={kcContext.message?.type !== 'warning'}
      headerNode={msg('emailVerifyTitle')}
      infoNode={
        <a className="bf-link" href={url.loginRestartFlowUrl}>
          {msg('bruzfinBackToLogin')}
        </a>
      }
    >
      {user?.email ? (
        <p className="bf-subtitle">{msg('bruzfinVerifySubtitle', user.email)}</p>
      ) : null}
      <div className="bf-notice">
        <EnvelopeIcon />
        <span>{msg('bruzfinVerifyBody')}</span>
      </div>
      <a className="bf-link bf-link--center" href={url.loginAction}>
        {msg('bruzfinResend')}
      </a>
    </Template>
  );
}

import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { SubmitButton } from '../components/fields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login-idp-link-confirm.ftl' }>, I18n>;

/** Entrou com o Google e já existe conta com o mesmo email: confirmar o vínculo (KAN-27). */
export default function LoginIdpLinkConfirm({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      headerNode={msg('confirmLinkIdpTitle')}
    >
      <p className="bf-subtitle">{msg('bruzfinLinkIdpBody')}</p>
      <form id="kc-register-form" className="bf-form" action={url.loginAction} method="post">
        <SubmitButton
          label={msgStr('bruzfinLinkIdpConfirm')}
          name="submitAction"
          value="linkAccount"
        />
        <SubmitButton
          label={msgStr('bruzfinLinkIdpReview')}
          name="submitAction"
          value="updateProfile"
          primary={false}
        />
      </form>
    </Template>
  );
}

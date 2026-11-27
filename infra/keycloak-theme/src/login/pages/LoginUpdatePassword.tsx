import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { useState } from 'react';
import { PasswordField, SubmitButton } from '../components/fields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login-update-password.ftl' }>, I18n>;

/**
 * Nova senha (depois do link de recuperação). "Sair dos outros aparelhos" vai sempre ligado:
 * trocar a senha derruba as outras sessões e os refresh tokens antigos.
 */
export default function LoginUpdatePassword({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      // O aviso "você precisa mudar sua senha" repete o subtítulo; erros aparecem nos campos.
      displayMessage={
        kcContext.message?.type !== 'warning' &&
        !messagesPerField.existsError('password', 'password-confirm')
      }
      headerNode={msg('updatePasswordTitle')}
    >
      <p className="bf-subtitle">{msg('bruzfinUpdatePasswordSubtitle')}</p>
      <form
        id="kc-passwd-update-form"
        className="bf-form"
        action={url.loginAction}
        method="post"
        onSubmit={() => setSubmitting(true)}
      >
        <PasswordField
          label={msgStr('passwordNew')}
          name="password-new"
          autoComplete="new-password"
          placeholder={msgStr('bruzfinNewPasswordPlaceholder')}
          required
          autoFocus
          showLabel={msgStr('bruzfinShowPassword')}
          hideLabel={msgStr('bruzfinHidePassword')}
          hint={msgStr('bruzfinPasswordHint')}
          error={messagesPerField.get('password') || undefined}
        />
        <PasswordField
          label={msgStr('passwordConfirm')}
          name="password-confirm"
          autoComplete="new-password"
          placeholder={msgStr('bruzfinConfirmPlaceholder')}
          required
          showLabel={msgStr('bruzfinShowPassword')}
          hideLabel={msgStr('bruzfinHidePassword')}
          error={messagesPerField.get('password-confirm') || undefined}
        />
        <input type="hidden" name="logout-sessions" value="on" />
        <p className="bf-hint">{msg('bruzfinLogoutOtherDevices')}</p>
        <SubmitButton label={msgStr('bruzfinSaveNewPassword')} disabled={submitting} />
        {isAppInitiatedAction ? (
          <SubmitButton
            label={msgStr('doCancel')}
            name="cancel-aia"
            value="true"
            primary={false}
            disabled={submitting}
          />
        ) : null}
      </form>
    </Template>
  );
}

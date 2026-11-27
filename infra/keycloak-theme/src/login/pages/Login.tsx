import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { useState } from 'react';
import { EnvelopeIcon, PasswordField, SubmitButton, TextField } from '../components/fields';
import { SocialProviders } from '../components/SocialProviders';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login.ftl' }>, I18n>;

export default function Login({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url, realm, login, usernameHidden, messagesPerField, message, social } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);

  // Depois de pedir a recuperação, o Keycloak volta ao login com este aviso: vira "Confira seu email".
  const resetEmailSent =
    message?.type === 'success' && message.summary === msgStr('emailSentMessage');
  const credentialsError = messagesPerField.getFirstError('username', 'password');

  if (resetEmailSent) {
    return (
      <Template
        kcContext={kcContext}
        i18n={i18n}
        doUseDefaultCss={doUseDefaultCss}
        displayMessage={false}
        headerNode={msg('bruzfinCheckEmailTitle')}
        infoNode={
          <a className="bf-link" href={url.loginUrl}>
            {msg('bruzfinBackToLogin')}
          </a>
        }
      >
        <p className="bf-subtitle">{message.summary}</p>
        <div className="bf-notice">
          <EnvelopeIcon />
          <span>{msg('bruzfinResetSentBody')}</span>
        </div>
        <a className="bf-link bf-link--center" href={url.loginResetCredentialsUrl}>
          {msg('bruzfinResend')}
        </a>
      </Template>
    );
  }

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      // Erro de credenciais aparece junto dos campos; os demais avisos ficam no topo.
      displayMessage={!messagesPerField.existsError('username', 'password')}
      headerNode={msg('loginAccountTitle')}
      socialProvidersNode={<SocialProviders social={social} i18n={i18n} />}
      infoNode={
        realm.password && realm.registrationAllowed && !kcContext.registrationDisabled ? (
          <>
            {msg('bruzfinNoAccount')}{' '}
            <a className="bf-link" href={url.registrationUrl}>
              {msg('bruzfinCreateAccount')}
            </a>
          </>
        ) : null
      }
    >
      {realm.password ? (
        <form
          id="kc-form-login"
          className="bf-form"
          action={url.loginAction}
          method="post"
          onSubmit={() => setSubmitting(true)}
        >
          {usernameHidden ? null : (
            <TextField
              label={msgStr('email')}
              name="username"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={msgStr('bruzfinEmailPlaceholder')}
              defaultValue={login.username ?? ''}
              required
              autoFocus
              error={credentialsError || undefined}
            />
          )}
          <PasswordField
            label={msgStr('password')}
            name="password"
            autoComplete="current-password"
            placeholder={msgStr('bruzfinPasswordPlaceholder')}
            required
            showLabel={msgStr('bruzfinShowPassword')}
            hideLabel={msgStr('bruzfinHidePassword')}
            error={usernameHidden ? credentialsError || undefined : undefined}
          />
          {realm.resetPasswordAllowed ? (
            <a className="bf-link bf-link--end" href={url.loginResetCredentialsUrl}>
              {msg('doForgotPassword')}
            </a>
          ) : null}
          <input
            type="hidden"
            name="credentialId"
            value={kcContext.auth.selectedCredential ?? ''}
          />
          <SubmitButton label={msgStr('doLogIn')} name="login" disabled={submitting} />
        </form>
      ) : null}
    </Template>
  );
}

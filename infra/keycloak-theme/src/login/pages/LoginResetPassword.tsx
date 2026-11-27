import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { useState } from 'react';
import { SubmitButton, TextField } from '../components/fields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'login-reset-password.ftl' }>, I18n>;

/** Recuperar senha: a resposta é sempre a mesma, exista ou não a conta. */
export default function LoginResetPassword({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url, auth, messagesPerField } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      displayMessage={!messagesPerField.existsError('username')}
      headerNode={msg('emailForgotTitle')}
      infoNode={
        <>
          {msg('bruzfinRememberedPassword')}{' '}
          <a className="bf-link" href={url.loginUrl}>
            {msg('bruzfinBackToLogin')}
          </a>
        </>
      }
    >
      <p className="bf-subtitle">{msg('bruzfinForgotSubtitle')}</p>
      <form
        id="kc-reset-password-form"
        className="bf-form"
        action={url.loginAction}
        method="post"
        onSubmit={() => setSubmitting(true)}
      >
        <TextField
          label={msgStr('email')}
          name="username"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={msgStr('bruzfinEmailPlaceholder')}
          defaultValue={auth.attemptedUsername ?? ''}
          required
          autoFocus
          error={messagesPerField.get('username') || undefined}
        />
        <SubmitButton label={msgStr('bruzfinSendResetLink')} disabled={submitting} />
      </form>
    </Template>
  );
}

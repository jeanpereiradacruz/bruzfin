import type { Attribute } from 'keycloakify/login/KcContext';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { useState } from 'react';
import { PasswordField, SubmitButton, TextField } from '../components/fields';
import { type SocialContext, SocialProviders } from '../components/SocialProviders';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';

type Props = PageProps<Extract<KcContext, { pageId: 'register.ftl' }>, I18n>;

const AUTOCOMPLETE: Record<string, string> = {
  email: 'email',
  firstName: 'given-name',
  lastName: 'family-name',
  username: 'username',
};

/** Ordem do design: nome, sobrenome, email (o email é o usuário no realm). */
const ORDER = ['firstName', 'lastName', 'email', 'username'];

export default function Register({ kcContext, i18n, Template, doUseDefaultCss }: Props) {
  const { url, profile, messagesPerField, realm, locale } = kcContext;
  // Com "Verify Email" ligado, o Keycloak 26 não pede a senha no cadastro (nem manda `passwordRequired`):
  // a pessoa confirma o email e só então cria a senha (tela "Crie sua senha").
  const passwordRequired = kcContext.passwordRequired === true;
  const { msg, msgStr, advancedMsgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);

  const attributes = Object.values(profile.attributesByName)
    .filter((a: Attribute) => !(realm.registrationEmailAsUsername && a.name === 'username'))
    // Idioma vai oculto (abaixo), como no tema padrão.
    .filter((a: Attribute) => a.name !== 'locale')
    .sort((a, b) => rank(a.name) - rank(b.name));

  // O Keycloak também manda os provedores (Google) no cadastro, embora o tipo não declare.
  const social = (kcContext as { social?: SocialContext }).social;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      displayMessage={messagesPerField.exists('global')}
      headerNode={msg('registerTitle')}
      socialProvidersNode={<SocialProviders social={social} i18n={i18n} />}
      infoNode={
        <>
          {msg('bruzfinHasAccount')}{' '}
          <a className="bf-link" href={url.loginUrl}>
            {msg('doLogIn')}
          </a>
        </>
      }
    >
      <form
        id="kc-register-form"
        className="bf-form"
        action={url.registrationAction}
        method="post"
        onSubmit={() => setSubmitting(true)}
      >
        {attributes.map((attribute) => (
          <TextField
            key={attribute.name}
            label={advancedMsgStr(attribute.displayName ?? attribute.name)}
            name={attribute.name}
            type={attribute.name === 'email' ? 'email' : 'text'}
            inputMode={attribute.name === 'email' ? 'email' : undefined}
            autoCapitalize={attribute.name === 'email' ? 'none' : 'words'}
            autoComplete={AUTOCOMPLETE[attribute.name] ?? 'off'}
            placeholder={attribute.name === 'email' ? msgStr('bruzfinEmailPlaceholder') : undefined}
            defaultValue={attribute.value ?? ''}
            required={attribute.required}
            readOnly={attribute.readOnly}
            error={messagesPerField.get(attribute.name) || undefined}
          />
        ))}
        {passwordRequired ? (
          <>
            <PasswordField
              label={msgStr('password')}
              name="password"
              autoComplete="new-password"
              placeholder={msgStr('bruzfinNewPasswordPlaceholder')}
              required
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
          </>
        ) : null}
        {locale && 'locale' in profile.attributesByName ? (
          <input type="hidden" name="locale" value={locale.currentLanguageTag} />
        ) : null}
        <SubmitButton label={msgStr('doRegister')} disabled={submitting} />
      </form>
    </Template>
  );
}

const rank = (name: string) => {
  const index = ORDER.indexOf(name);
  return index === -1 ? ORDER.length : index;
};

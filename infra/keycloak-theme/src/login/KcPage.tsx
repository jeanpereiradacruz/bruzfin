import type { ClassKey } from 'keycloakify/login';
import DefaultPage from 'keycloakify/login/DefaultPage';
import { lazy, Suspense } from 'react';
import { useI18n } from './i18n';
import type { KcContext } from './KcContext';
import Template from './Template';

const UserProfileFormFields = lazy(() => import('keycloakify/login/UserProfileFormFields'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const LoginResetPassword = lazy(() => import('./pages/LoginResetPassword'));
const LoginVerifyEmail = lazy(() => import('./pages/LoginVerifyEmail'));
const LoginUpdatePassword = lazy(() => import('./pages/LoginUpdatePassword'));
const LoginPageExpired = lazy(() => import('./pages/LoginPageExpired'));
const LoginIdpLinkConfirm = lazy(() => import('./pages/LoginIdpLinkConfirm'));
const ErrorPage = lazy(() => import('./pages/Error'));
const Info = lazy(() => import('./pages/Info'));

/**
 * Telas com o visual BruzFin. As que o app não usa hoje (OTP, WebAuthn, termos...) caem na página
 * padrão do Keycloakify, mas dentro da mesma moldura e com as classes abaixo.
 */
export default function KcPage({ kcContext }: { readonly kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });
  const common = { i18n, Template, doUseDefaultCss: false, classes } as const;

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case 'login.ftl':
            return <Login kcContext={kcContext} {...common} />;
          case 'register.ftl':
            return <Register kcContext={kcContext} {...common} />;
          case 'login-reset-password.ftl':
            return <LoginResetPassword kcContext={kcContext} {...common} />;
          case 'login-verify-email.ftl':
            return <LoginVerifyEmail kcContext={kcContext} {...common} />;
          case 'login-update-password.ftl':
            return <LoginUpdatePassword kcContext={kcContext} {...common} />;
          case 'login-page-expired.ftl':
            return <LoginPageExpired kcContext={kcContext} {...common} />;
          case 'login-idp-link-confirm.ftl':
            return <LoginIdpLinkConfirm kcContext={kcContext} {...common} />;
          case 'error.ftl':
            return <ErrorPage kcContext={kcContext} {...common} />;
          case 'info.ftl':
            return <Info kcContext={kcContext} {...common} />;
          default:
            return (
              <DefaultPage
                kcContext={kcContext}
                {...common}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={true}
              />
            );
        }
      })()}
    </Suspense>
  );
}

const classes = {
  kcFormClass: 'bf-form',
  kcFormGroupClass: 'bf-field',
  kcLabelClass: 'bf-label',
  kcInputClass: 'bf-input',
  kcInputErrorMessageClass: 'bf-error',
  kcInputHelperTextBeforeClass: 'bf-hint',
  kcInputHelperTextAfterClass: 'bf-hint',
  kcButtonClass: 'bf-button',
  kcButtonPrimaryClass: 'bf-button--primary',
  kcButtonDefaultClass: '',
  kcButtonBlockClass: '',
  kcButtonLargeClass: '',
  kcFormButtonsClass: 'bf-form',
  kcFormOptionsWrapperClass: 'bf-hint',
} satisfies { [key in ClassKey]?: string };

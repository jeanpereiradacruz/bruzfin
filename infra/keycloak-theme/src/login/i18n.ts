import { i18nBuilder } from 'keycloakify/login';
import type { ThemeName } from '../kc.gen';

/**
 * Textos do tema em pt-BR (único idioma do realm). As chaves `bruzfin*` são do tema; as demais
 * substituem mensagens do Keycloak (inclusive as que o servidor monta, como o aviso de email enviado).
 * Erros de login e cadastro são genéricos: nunca dizem se um email está cadastrado.
 */

const { useI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  // Objeto literal: o Keycloakify lê estas traduções no build e as grava no tema do servidor.
  .withCustomTranslations({
    'pt-BR': {
      bruzfinTagline: 'Seu dinheiro, com clareza.',
      bruzfinEmailPlaceholder: 'voce@exemplo.com',
      bruzfinPasswordPlaceholder: 'Sua senha',
      bruzfinNewPasswordPlaceholder: 'Crie uma senha',
      bruzfinConfirmPlaceholder: 'Repita a senha',
      bruzfinPasswordHint: 'Mínimo de 8 caracteres, com letras e números.',
      bruzfinShowPassword: 'Mostrar senha',
      bruzfinHidePassword: 'Ocultar senha',
      bruzfinOr: 'ou',
      bruzfinContinueWith: 'Continuar com {0}',
      bruzfinNoAccount: 'Não tem conta?',
      bruzfinCreateAccount: 'Criar conta',
      bruzfinHasAccount: 'Já tem conta?',
      bruzfinRememberedPassword: 'Lembrou a senha?',
      bruzfinBackToLogin: 'Voltar para o login',
      bruzfinForgotSubtitle:
        'Informe o email da sua conta. Vamos enviar um link para criar uma nova senha.',
      bruzfinSendResetLink: 'Enviar link de recuperação',
      bruzfinCheckEmailTitle: 'Confira seu email',
      bruzfinResetSentBody:
        'Abra o email e toque no link para criar uma nova senha. Ele vale por 30 minutos.',
      bruzfinResend: 'Não recebeu? Enviar de novo',
      bruzfinVerifySubtitle: 'Enviamos um link de confirmação para {0}.',
      bruzfinVerifyBody:
        'Abra o email e toque no link para confirmar. Em seguida, você cria a senha da sua conta.',
      bruzfinErrorTitle: 'Algo deu errado',
      bruzfinExpiredTitle: 'Link expirado',
      bruzfinExpiredBody: 'Este link já venceu ou já foi usado. Comece de novo pelo login.',
      bruzfinUpdatePasswordSubtitle: 'Escolha a senha que você vai usar para entrar no BruzFin.',
      bruzfinSaveNewPassword: 'Salvar senha',
      bruzfinLogoutOtherDevices:
        'Por segurança, a conta sai dos outros aparelhos em que estiver aberta.',
      bruzfinLinkIdpBody:
        'Já existe uma conta BruzFin com este email. Para unir as duas, confirme que ela é sua.',
      bruzfinLinkIdpConfirm: 'Confirmar que a conta é minha',
      bruzfinLinkIdpReview: 'Revisar meus dados',
      bruzfinContinue: 'Continuar',
      bruzfinAllSet: 'Tudo certo',
      bruzfinBackToApp: 'Pronto. Volte ao app BruzFin e entre com seu email e senha.',
      bruzfinRequiredActions: 'Para continuar, conclua: {0}.',

      loginAccountTitle: 'Entrar na sua conta',
      loginTitle: 'BruzFin',
      loginTitleHtml: 'BruzFin',
      registerTitle: 'Criar conta',
      emailForgotTitle: 'Recuperar senha',
      emailVerifyTitle: 'Confira seu email',
      pageExpiredTitle: 'Página expirada',
      updatePasswordTitle: 'Crie sua senha',
      confirmLinkIdpTitle: 'Essa conta já existe',
      doLogIn: 'Entrar',
      doRegister: 'Criar conta',
      doForgotPassword: 'Esqueci minha senha',
      email: 'Email',
      username: 'Email',
      usernameOrEmail: 'Email',
      firstName: 'Nome',
      lastName: 'Sobrenome',
      password: 'Senha',
      passwordConfirm: 'Confirmar senha',
      passwordNew: 'Nova senha',
      emailSentMessage: 'Se existir uma conta com este email, o link chega em instantes.',
      invalidUserMessage: 'Email ou senha inválidos.',
      invalidEmailMessage: 'Informe um email válido.',
      emailExistsMessage:
        'Não foi possível criar a conta com esses dados. Se você já tem conta, entre ou recupere a senha.',
      usernameExistsMessage:
        'Não foi possível criar a conta com esses dados. Se você já tem conta, entre ou recupere a senha.',
      notMatchPasswordMessage: 'As senhas não são iguais.',
      missingPasswordMessage: 'Informe a senha.',
      invalidPasswordMinLengthMessage: 'A senha precisa ter pelo menos {0} caracteres.',
      invalidPasswordMinDigitsMessage: 'A senha precisa ter pelo menos {0} número(s).',
      invalidPasswordRegexPatternMessage: 'A senha precisa ter letras e números.',
      invalidPasswordNotUsernameMessage: 'A senha não pode ser igual ao email.',
      invalidPasswordNotEmailMessage: 'A senha não pode ser igual ao email.',
      invalidPasswordHistoryMessage: 'Use uma senha diferente das últimas que você usou.',
      accountTemporarilyDisabledMessage: 'Email ou senha inválidos.',
      accountDisabledMessage: 'Email ou senha inválidos.',
      expiredActionMessage: 'Este link já venceu. Peça um novo.',
      expiredActionTokenNoSessionMessage: 'Este link já venceu. Peça um novo.',
      expiredActionTokenSessionExistsMessage: 'Este link já venceu. Peça um novo.',
      expiredCodeMessage: 'O tempo para entrar acabou. Tente de novo.',
      confirmEmailAddressVerificationHeader: 'Confirmar email',
      confirmEmailAddressVerification: 'Toque em Continuar para confirmar o email {0}.',
      emailVerifiedMessageHeader: 'Email confirmado',
      emailVerifiedMessage: 'Seu email foi confirmado.',
      emailVerifiedAlreadyMessageHeader: 'Email confirmado',
      emailVerifiedAlreadyMessage: 'Este email já estava confirmado.',
      staleEmailVerificationLink:
        'Este link de confirmação não vale mais. Talvez o email já esteja confirmado: tente entrar.',
      accountPasswordUpdatedMessage: 'Senha salva.',
      accountUpdatedMessage: 'Sua conta está pronta.',
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { type I18n, useI18n };

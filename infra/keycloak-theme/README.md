# @bruzfin/keycloak-theme

Tema BruzFin do Keycloak, feito com [Keycloakify](https://docs.keycloakify.dev) 11 (React + Vite). Ele deixa
as telas de login, cadastro e recuperação com o visual do design "App · Login e cadastro" e também
cobre os emails de verificação e de recuperação.

- Cores, fontes e raios vêm de `@bruzfin/design-tokens`. O tema segue o claro ou o escuro do sistema.
- Manrope e Inter vão empacotadas no tema (`@fontsource`), sem CDN.
- Os textos ficam em pt-BR (`src/login/i18n.ts`). As chaves `bruzfin*` são do tema; as demais substituem
  mensagens do Keycloak, inclusive as que o servidor monta.
- Os erros de login e cadastro são genéricos e não dizem se um email está cadastrado.

## Telas

| Página do Keycloak                   | Tela                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `login.ftl`                          | Entrar na sua conta. Depois de pedir a recuperação, vira "Confira seu email", com reenvio                 |
| `register.ftl`                       | Criar conta: nome, sobrenome e email                                                                      |
| `login-reset-password.ftl`           | Recuperar senha                                                                                           |
| `login-verify-email.ftl`             | Confira seu email (cadastro), com reenvio                                                                 |
| `login-update-password.ftl`          | Crie sua senha (depois de confirmar o email ou pelo link de recuperação). Sempre sai dos outros aparelhos |
| `error.ftl`                          | Algo deu errado. Link vencido ou já usado aparece como "Link expirado"                                    |
| `login-page-expired.ftl`, `info.ftl` | Páginas de apoio com o mesmo visual                                                                       |
| `login-idp-link-confirm.ftl`         | Confirmar o vínculo com uma conta já existente (Google, KAN-27)                                           |

As outras páginas (OTP, WebAuthn, termos) usam a página padrão do Keycloakify dentro da mesma moldura.

**Senha no cadastro:** com "Verify Email" ligado, o Keycloak 26 não pede a senha no formulário de
cadastro. A pessoa confirma o email e só então cria a senha (tela "Crie sua senha"). Se o Keycloak
mandar `passwordRequired`, a tela de cadastro mostra os campos de senha.

## Comandos

```bash
pnpm --filter @bruzfin/keycloak-theme dev        # telas com contexto falso: http://localhost:5173/?page=register.ftl
pnpm --filter @bruzfin/keycloak-theme test       # Vitest + Testing Library
pnpm --filter @bruzfin/keycloak-theme build:jar  # gera dist_keycloak/bruzfin-theme.jar e copia para providers/ (precisa do Maven)
```

No compose, `providers/` é montada em `/opt/keycloak/providers`. Depois do `build:jar`, rode
`docker compose -f infra/compose/docker-compose.yml restart keycloak`. Sem o `.jar`, o Keycloak usa o
tema padrão (é o que acontece nos testes de integração da API).

O realm já declara `loginTheme` e `emailTheme` como `bruzfin`. Num Keycloak local que já existia, o
import não atualiza o realm: escolha o tema em _Realm settings → Themes_ ou recrie o banco do Keycloak
(`infra/README.md`).

`src/kc.gen.tsx` é gerado pelo `pnpm --filter @bruzfin/keycloak-theme update-kc-gen`. Não edite à mão.

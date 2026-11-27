# @bruzfin/core

Domínio e casos de uso do BruzFin em **TypeScript puro**, compartilhados entre o app (React Native) e o web (Next.js).

## Camadas

```
src/
  shared/        # Result, DomainError — utilitários sem regra de negócio
  domain/        # entidades e value objects (ex.: Money). Sem I/O, sem framework
  application/   # casos de uso e portas (interfaces que o app/web implementam)
```

Regras:
- `domain` não conhece `application`; nenhuma camada conhece React, React Native, Expo, Next.js, TanStack ou Zustand. O Biome bloqueia esses imports aqui (`noRestrictedImports`).
- Erros esperados são valores (`Result`), não exceções. Exceções só para bugs de programação.
- Precisa de algo externo (HTTP, armazenamento seguro, notificações)? Declare uma **porta** em `application/` e implemente o **adapter** no app.

## Money

Valor monetário imutável em **centavos inteiros** — nunca ponto flutuante.

```ts
import { Money } from '@bruzfin/core';

const result = Money.parse('R$ 1.234,56'); // entrada do usuário
if (result.ok) result.value.format(); // 'R$ 1.234,56'

Money.fromCents(-21437).format({ sign: 'always' }); // '− R$ 214,37'
Money.fromDecimalString('8500.00'); // valor vindo da API
gasto.reachedPercentOf(limite, 80); // alerta de 80% do limite
```

## Autenticação

`SignIn` orquestra o login sem conhecer Expo nem HTTP:

1. `AuthGateway.authorize({ mode })` — Authorization Code + PKCE no provedor (`sign-in` ou `sign-up`);
2. `CurrentUserGateway.fetchCurrentUser(accessToken)` — confirma o token na API (`/me`);
3. `SessionManager.start(session)` — só com o perfil confirmado.

Erros são valores com mensagens genéricas em pt-BR (`auth.cancelled`, `auth.failed`,
`auth.profile-unavailable`).

`SessionManager` cuida da sessão depois do login:

- `restore()` ao abrir o app: lê o `TokenStorage` (Keystore) e renova se o access token venceu;
- `getAccessToken()` / `handleUnauthorized(token)` para o cliente HTTP: renova antes de vencer
  (margem de 60 s) e **uma única vez** para requisições simultâneas (o Keycloak rotaciona o refresh);
- refresh recusado → `SessionStore.clear('expired')` (a tela de entrada mostra o aviso);
- `signOut()` apaga do aparelho primeiro e depois encerra a sessão no provedor (`TokenGateway`);
  sem internet, o refresh vai para a `PendingRevocationQueue` e é revogado depois.

`AppLock` é o bloqueio opcional com biometria/PIN do aparelho (`DeviceAuthenticator`): bloqueia ao
abrir o app com sessão e ao voltar após 5 minutos em segundo plano.

## Lar

`HouseholdService` (ver, renomear, convidar, entrar com código) fala com a API pelo `HouseholdGateway`
e mantém `CurrentUser.household` igual ao da API por `SessionUserUpdater` (o `SessionManager.updateUser`).
Valida antes de ir à rede com `validateHouseholdName` e `normalizeInviteCode` (mesmas regras da API).
As gravações da sessão (`start`, renovação, `updateUser`) passam por uma fila: uma troca de lar durante
uma renovação não sobrescreve o refresh token rotacionado.

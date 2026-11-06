# @bruzfin/mobile

App Android do BruzFin: Expo SDK 58, React Native 0.88 (New Architecture), Expo Router, Unistyles 3.

## Estrutura

```
src/
  app/              # rotas do Expo Router (arquivos finos que só exportam telas)
  presentation/     # telas, componentes e tema (Unistyles + @bruzfin/design-tokens)
  infrastructure/   # adapters: login (expo-auth-session), API (orval), config, FLAG_SECURE
  composition/      # composition root: liga casos de uso do @bruzfin/core aos adapters
```

## Pré-requisitos para rodar no Android

- Node 24 e pnpm 12 (ver README da raiz)
- **JDK 17** (`JAVA_HOME` apontando para ele)
- Android SDK em `~/Android/Sdk` com: **Platform 37**, **Build-Tools 37.0.0**, **NDK 27.1.12297006** e um emulador (ou celular com depuração USB)
- Variáveis de ambiente:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

## Comandos

```bash
pnpm android        # gera o projeto nativo, compila e instala o dev build no emulador
pnpm start          # inicia o Metro para o dev build já instalado
pnpm test           # testes (Jest + React Native Testing Library)
pnpm typecheck
pnpm check:deps     # confere se as versões batem com o Expo SDK
```

A pasta `android/` é gerada pelo `expo prebuild` e não é versionada; toda configuração nativa fica no `app.json` e em config plugins.

## Login (OAuth2 + PKCE)

- "Entrar" e "Criar conta" abrem a página do BruzFin no Keycloak pelo navegador seguro do sistema
  (Custom Tabs), com Authorization Code + PKCE (S256) e validação de `state`. O app nunca vê a senha.
  "Criar conta" usa `prompt=create` (cadastro direto).
- O retorno chega por `bruzfin://auth/callback` (`scheme` do app.json); `src/app/+native-intent.tsx`
  impede o router de tratar esse link como rota.
- Depois do login o app chama `GET /api/v1/me`; só com o perfil confirmado a sessão é criada e a guarda
  de rotas (`Stack.Protected` em `src/app/_layout.tsx`) leva ao Início.
- Tokens ficam **só em memória** por enquanto (fechou o app, precisa entrar de novo). Keystore,
  renovação e sair entram no KAN-29.
- Configuração por `EXPO_PUBLIC_*` (ver `.env.example`). Em desenvolvimento, sem `.env`, vale o ambiente
  local; em release todas são obrigatórias e HTTPS.

Rodando local no emulador ou celular (USB):

```bash
docker compose -f infra/compose/docker-compose.yml up -d                     # Keycloak em :8180
(cd services/api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local)  # API em :8080
adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8180 tcp:8180               # localhost do aparelho → máquina
```

Usuário de teste: `usuario@bruzfin.local` / `Teste1234`. Errar a senha 5 vezes bloqueia a conta por
alguns minutos (proteção contra força bruta do realm).

## E2E (Maestro)

```bash
maestro test .maestro      # login e cancelamento; precisa do ambiente local acima e do dev build
```

## Segurança

- `FLAG_SECURE` ligado (`expo-screen-capture`): sem prints, gravação de tela ou prévia na lista de apps recentes.
- `allowBackup: false`: os dados do app não vão para o backup do Google.
- Para tirar prints durante o desenvolvimento (testes visuais), inicie o Metro com
  `EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE=1 pnpm start`. A exceção só vale em build de desenvolvimento.

## Dica de build

`pnpm android` compila só para a arquitetura do aparelho conectado. Rodando o Gradle direto,
use `./gradlew installDebug -PreactNativeArchitectures=x86_64` (emulador) ou `arm64-v8a` (celular)
para não compilar o código nativo para 4 arquiteturas.

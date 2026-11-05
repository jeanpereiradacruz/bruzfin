# @bruzfin/mobile

App Android do BruzFin: Expo SDK 58, React Native 0.88 (New Architecture), Expo Router, Unistyles 3.

## Estrutura

```
src/
  app/              # rotas do Expo Router (arquivos finos que só exportam telas)
  presentation/     # telas, componentes e tema (Unistyles + @bruzfin/design-tokens)
  infrastructure/   # adapters de plataforma (ex.: FLAG_SECURE)
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

## Segurança

- `FLAG_SECURE` ligado (`expo-screen-capture`): sem prints, gravação de tela ou prévia na lista de apps recentes.
- `allowBackup: false`: os dados do app não vão para o backup do Google.
- Para tirar prints durante o desenvolvimento (testes visuais), inicie o Metro com
  `EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE=1 pnpm start`. A exceção só vale em build de desenvolvimento.

## Dica de build

`pnpm android` compila só para a arquitetura do aparelho conectado. Rodando o Gradle direto,
use `./gradlew installDebug -PreactNativeArchitectures=x86_64` (emulador) ou `arm64-v8a` (celular)
para não compilar o código nativo para 4 arquiteturas.

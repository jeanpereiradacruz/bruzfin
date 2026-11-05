# BruzFin - Controle Financeiro

Controle financeiro doméstico com monitoramento de conta compartilhado entre os membros do lar. App Android em React Native (Expo), API em Java 25 + Spring Boot 4 e, futuramente, versão web em Next.js.

## Estrutura

```
apps/
  mobile/            # App Expo (React Native)
  web/               # Next.js (futuro)
packages/
  config/            # tsconfig e Biome compartilhados
  core/              # domínio e casos de uso em TypeScript puro
  design-tokens/     # tokens do design system BruzFin
  api-client/        # cliente gerado a partir do OpenAPI da API
services/
  api/               # API Spring Boot (Maven)
infra/
  compose/           # Docker Compose (PostgreSQL, Valkey, Kafka, Keycloak)
  keycloak-theme/    # tema de login (Keycloakify)
```

## Pré-requisitos

- Node.js 24 LTS (`nvm use` lê o `.nvmrc`)
- pnpm 12 via Corepack: `corepack enable`
- Java 25 e Docker (a partir da API e do ambiente local)

## Como rodar

```bash
nvm use
corepack enable
pnpm install

pnpm lint        # Biome em todo o monorepo
pnpm typecheck   # TypeScript em todos os pacotes
pnpm test        # testes
pnpm check       # lint + typecheck + test
pnpm format      # formata o código
```

As tarefas são orquestradas pelo Turborepo, com cache local.

## Convenções

- Commits no padrão Conventional Commits, em português, com a chave do Jira: `feat(auth): adiciona login (KAN-25)`.
- Uma branch por ticket: `feat/KAN-<n>-<descricao>`; PR obrigatória para a `main`.
- Instalações respeitam o `minimumReleaseAge` do pnpm (versões publicadas há pouco tempo não são instaladas).

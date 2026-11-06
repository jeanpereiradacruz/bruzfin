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

Plano de execução, decisões e fases: [docs/plano.md](docs/plano.md).

## Pré-requisitos

- Node.js 24 LTS (`nvm use` lê o `.nvmrc`)
- pnpm 12 via Corepack: `corepack enable`
- Java 25 e Docker (a partir da API e do ambiente local)

## Configurar uma máquina nova

1. **Ferramentas**
   - Node.js 24 com [nvm](https://github.com/nvm-sh/nvm) e pnpm via Corepack (`corepack enable`).
   - JDK 25 para a API (ex.: `sdk install java 25-tem` com [SDKMAN](https://sdkman.io)).
   - Docker com Compose v2 (usuário no grupo `docker`).
   - Para o app Android: JDK 17, Android SDK e um emulador — veja [apps/mobile/README.md](apps/mobile/README.md).
2. **Repositório e Git** — o email _noreply_ do GitHub mantém o email pessoal fora dos commits:

   ```bash
   git clone https://github.com/jeanpereiradacruz/bruzfin.git && cd bruzfin
   git config user.name "<seu nome>"
   git config user.email "<id>+<usuario>@users.noreply.github.com"
   ```
3. **GitHub CLI** — o escopo `workflow` é necessário para enviar mudanças em `.github/workflows`:

   ```bash
   gh auth login
   gh auth refresh -h github.com -s workflow
   ```
4. **Ambiente local**

   ```bash
   cp infra/compose/.env.example infra/compose/.env
   docker compose -f infra/compose/docker-compose.yml up -d
   nvm use && corepack enable && pnpm install && pnpm check
   (cd services/api && ./mvnw verify)
   ```
5. **Claude Code + Jira** — o servidor MCP da Atlassian já está em [`.mcp.json`](.mcp.json) (sem credenciais). Ao abrir o Claude Code na pasta do projeto, aprove o servidor `atlassian` e faça login com `/mcp`. Para retomar, peça para conferir o Jira e o `git log` e seguir pelo próximo ticket do épico em andamento. O plano completo está em [docs/plano.md](docs/plano.md).

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

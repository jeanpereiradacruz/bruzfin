# BruzFin — guia do projeto

App de controle financeiro pessoal/doméstico. **Foco atual: app Android em React Native.** A versão web (Next.js) vem depois e deve reaproveitar `packages/core`, `packages/api-client` e `packages/design-tokens`.

Restrição principal: **tudo grátis**, uso por poucos usuários (um lar). Segurança e performance são prioridade.

## Decisões fechadas (não reabrir sem o usuário pedir)

- **Usuários e lar:** cada usuário tem login próprio; usuários participam de um **lar** para o monitoramento de conta compartilhado. Um usuário pertence a um único lar.
- **Visibilidade:** conta/cartão é **Compartilhada** (todos do lar veem) ou **Só minha** (privada: só o dono vê a conta e seus lançamentos). Lançamentos herdam a visibilidade da conta (inclusive importados). Categorias, estabelecimentos e tags são do lar. Início e Gráficos têm filtro **Lar · Só eu**.
  Regra de acesso: `household_id = meu lar AND (visibility = SHARED OR owner_id = eu)` — aplicada nas consultas **e** em Row-Level Security no PostgreSQL.
- **Plataforma:** só Android, APK distribuído direto (sem Play Store). iOS fora de escopo.
- **Lançamentos:** manual (principal), importação CSV/XLSX/OFX e leitura de notificações do banco (Android). Importados e notificações vão para a fila "Para revisar" — **nada entra sem confirmação**. Detectar duplicidade entre as três origens.
- **Sem push e sem email de aviso.** Email só de sistema: verificação de cadastro e recuperação de senha (Brevo). Alerta de 80% do limite da categoria aparece **dentro do app**.

## Stack

**App (`apps/mobile`)**: Expo SDK (última) + New Architecture, TypeScript strict, dev build (não Expo Go) · Expo Router · TanStack Query · Zustand · React Hook Form + Zod · react-native-unistyles 3 · Victory Native XL · expo-auth-session (Authorization Code + PKCE) · expo-secure-store · expo-local-authentication · expo-document-picker · módulo Expo nativo em Kotlin (`NotificationListenerService`) · cliente gerado com **orval** · Jest + React Native Testing Library · Maestro (E2E) · Biome · Sentry (grátis) · EAS Build (APK; fallback `eas build --local`).

**Backend (`services/api`)**: **Java 25 LTS** · **Spring Boot 4** · **Maven** (`./mvnw`) · virtual threads · **Spring Modulith** (monólito modular) · Spring Security OAuth2 Resource Server · Spring Data JPA + Flyway · springdoc-openapi · Spring Kafka + Transactional Outbox · Testcontainers · **ArchUnit** · jMolecules · Actuator + Micrometer + OpenTelemetry → Grafana Cloud.

**Dados/infra**: PostgreSQL 18 · Valkey 8 (não Redis — licença) · Kafka 4 KRaft (1 broker) · Keycloak 26 + tema **Keycloakify** · Brevo (SMTP) · Mailpit (local) · Docker Compose.

**Nuvem**: Oracle Cloud Always Free (VM ARM 4 OCPU / 24 GB, São Paulo ou Vinhedo, conta PAYG com alerta de US$ 1) · Cloudflare Tunnel (sem portas abertas) · Tailscale (admin/deploy) · GHCR · backup `pg_dump` criptografado → Object Storage. Web futuro: **Vercel Hobby**. Plano B do banco: Neon.
Descartados: Fly.io (sem free tier), Koyeb (pouca RAM/dorme), Supabase (pausa), Upstash Kafka (encerrado), QStash/CloudAMQP (não é Kafka), AWS (free tier temporário).

## Arquitetura

```
apps/mobile/            # Expo (agora)
apps/web/               # Next.js (depois)
packages/core/          # domínio + casos de uso em TS puro (sem React)
packages/api-client/    # gerado pelo orval a partir do OpenAPI
packages/design-tokens/ # tokens do design system BruzFin
packages/config/        # tsconfig e Biome base
services/api/           # Spring Boot (Maven)
infra/compose/          # docker-compose, realm do Keycloak, cloudflared
infra/keycloak-theme/   # Keycloakify
.github/workflows/
```
Monorepo com **pnpm workspaces + Turborepo**.

**Backend — hexagonal por módulo Modulith**: `identity`, `household`, `accounts`, `transactions`, `catalog`, `imports`, `insights`, `privacy`. Em cada módulo:
```
<modulo>/domain/                # Java puro, sem Spring
<modulo>/application/port/in/   # casos de uso
<modulo>/application/port/out/  # repositórios, publicadores
<modulo>/application/service/
<modulo>/adapter/in/web/        # controllers + DTOs
<modulo>/adapter/out/persistence/
<modulo>/adapter/out/messaging/
```
ArchUnit garante: `domain` não depende de Spring nem de `adapter`; `application` não depende de `adapter`; módulos só se comunicam pela API pública ou por eventos.
Padrões previstos: Strategy (parsers CSV/XLSX/OFX), Chain of Responsibility (auto-tag), Factory, Adapter, Outbox, Specification (filtros).

**App — clean architecture**: `packages/core/domain` (entidades, `Money`), `packages/core/application` (casos de uso + portas como `AuthGateway`, `TokenStorage`, `TransactionGateway`), `apps/mobile/src/infrastructure` (adapters), `apps/mobile/src/presentation` (telas, componentes, hooks). DI por composition root (contexto React). Telas não conhecem HTTP.

## Regras de código

- SOLID e design patterns; casos de uso pequenos e testados.
- **Dinheiro**: `NUMERIC(19,2)` + `BigDecimal` no backend; centavos inteiros (`Money`) no TS. Nunca float.
- IDs UUIDv7. Logs sem dados financeiros nem tokens.
- Bean Validation na entrada; Zod no app.
- Segredos só em variáveis de ambiente; `.env` no `.gitignore`, `.env.example` versionado.
- Textos da UI em português (pt-BR).

## Segurança

OAuth2 Authorization Code + PKCE (sem password grant, sem implicit) · access token 5 min · refresh com rotação e revogação · app nunca vê a senha · tokens só no Keystore (SecureStore) · biometria opcional · `FLAG_SECURE` · validação de issuer/audience (`bruzfin-api`)/JWKS · rate limit Bucket4j + Valkey · CORS restrito · regra de visibilidade + RLS · LGPD: exportar dados e excluir conta via fluxo assíncrono (Kafka).

## Design

Fonte: Claude Design, canvas "BruzFin — App e Web": https://claude.ai/artifact/6AkYkiPGgQi84XyDxnhqQE (ler com a ferramenta Artifact, não WebFetch). Telas do app: `App-Login`, `Main` (Início), `App-NovaCompra`, `App-EditarCompra`, `App-Contas`, `App-ContaForm`, `App-Cadastros`, `App-Categoria`, `App-Estabelecimento`, `App-Graficos`, `App-GraficoForm`, `App-Importar`, `App-Perfil`, `App-ExcluirConta`.
Tokens (claro / escuro): surface-100 `#f7f8f6`/`#0f1513` · surface-000 `#ffffff`/`#171f1c` · border `#dfe4e0`/`#2a3531` · ink `#14201b`/`#eef2ef` · ink-muted `#55625c`/`#9aa8a1` · brand-600 `#0f7a5a`/`#3fbf8f` · on-brand `#ffffff`/`#0f1513` · brand-100 `#e3f2ec`/`#173a2e` · gold-500 `#c98a1b`/`#e0a43a` · on-gold `#14201b`/`#0f1513` · positive `#157347`/`#4cc38a` · negative `#b42318`/`#f2735f`.
Fontes: Manrope (display, títulos, valores) e Inter (texto). Espaço 4/8/16/24 · raio 6/10/16 · toques ≥ 44px · valores com `tabular-nums` · entrada/saída sempre com sinal e seta (▲ +, ▼ −), nunca só cor.
Acréscimos ao design: campo de visibilidade na conta e filtro "Lar · Só eu".

## Fluxo de trabalho

- Jira: projeto **KAN** em https://bruzfin.atlassian.net. **Épico = fase**, História/Tarefa = entrega testável com critérios de aceite; tarefas técnicas como checklist na descrição.
- Tickets **sem nomes pessoais** — usar "usuário", "membros do lar", "monitoramento de conta compartilhado".
- Por ticket: mover para "Em Progresso" → branch `feat/KAN-<n>-<slug>` (ou `fix/`, `chore/`) a partir da `main` → implementar com testes → commits **Conventional Commits em português** com a chave (`feat(auth): adiciona login com PKCE (KAN-25)`) → PR com `KAN-<n>` no título → CI verde → usuário revisa/testa → merge → "Concluído".
- **Commits e PRs só com o nome do usuário. Nunca adicionar `Co-Authored-By` ou qualquer menção ao Claude.**
- Nunca commitar direto na `main`.

## Fases (épicos no Jira)

| Épico                                                                            | Fase                             | Tickets                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KAN-4                                                                            | 1 · Fundação                     | KAN-14 monorepo · KAN-15 design-tokens · KAN-16 core · KAN-17 app com tema e abas · KAN-18 esqueleto da API · KAN-19 Docker Compose · KAN-20 CI                                                           |
| KAN-5                                                                            | 2 · Autenticação e lar           | KAN-21 realm Keycloak · KAN-22 Brevo · KAN-23 Keycloakify · KAN-24 cadastro · KAN-25 login · KAN-26 recuperar senha · KAN-27 Google · KAN-28 API `/me` · KAN-29 sessão segura · KAN-30 convite para o lar |
| KAN-6                                                                            | 3 · Infra na nuvem (Oracle)      | a detalhar                                                                                                                                                                                                |
| KAN-7                                                                            | 4 · Contas e cartões             | a detalhar                                                                                                                                                                                                |
| KAN-8                                                                            | 5 · Cadastros                    | a detalhar                                                                                                                                                                                                |
| KAN-9                                                                            | 6 · Lançamentos manuais e Início | a detalhar                                                                                                                                                                                                |
| KAN-10                                                                           | 7 · Gráficos                     | a detalhar                                                                                                                                                                                                |
| KAN-11                                                                           | 8 · Importação e notificações    | a detalhar                                                                                                                                                                                                |
| KAN-12                                                                           | 9 · Configurações e privacidade  | a detalhar                                                                                                                                                                                                |
| KAN-13                                                                           | 10 · Endurecimento e release 1.0 | a detalhar                                                                                                                                                                                                |
| Ordem: começar pelo **KAN-14**. Detalhar os tickets de cada fase ao chegar nela. |

## Comandos de verificação

- `pnpm install && pnpm turbo lint typecheck test`
- `cd services/api && ./mvnw verify` (inclui ArchUnit e Testcontainers)
- `docker compose -f infra/compose/docker-compose.yml up -d` → todos `healthy`

## Pendências do usuário

- Instalar o app **GitHub for Jira** e conectar o repositório `jeanpereiradacruz/bruzfin`.
- Excluir os tickets de exemplo KAN-1, KAN-2 e KAN-3 no Jira.

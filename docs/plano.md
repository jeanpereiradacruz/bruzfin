# BruzFin — Plano de execução

Plano aprovado antes do início da implementação, atualizado com o que foi decidido durante as fases. O `CLAUDE.md` traz o resumo e as regras; este documento traz o porquê e os detalhes de cada fase.

## Contexto

App de controle financeiro doméstico. Foco atual: **app Android em React Native**; a versão web (Next.js) vem depois e reaproveita `packages/core`, `packages/api-client` e `packages/design-tokens`.

O design está no Claude Design (canvas "BruzFin — App e Web"): 13 telas de app, 7 de web e o design system BruzFin (verde `brand-600 #0f7a5a`, dourado `gold-500`, Manrope/Inter, temas claro/escuro, raios 6/10/16).

Telas do app: Login/cadastro/recuperar senha (email + Google), Início (saldo do mês, gastos por categoria, últimos lançamentos), Nova compra/entrada (tags automáticas), Editar/excluir lançamento, Contas (lista por dia, filtro saídas/entradas), Conta ou cartão (limite, fechamento, vencimento), Cadastros (categorias, estabelecimentos, tags), Categoria (ícone, limite mensal com alerta em 80%), Estabelecimento (nome no extrato, tags padrão), Gráficos + criar gráfico (barras/linha/rosca, agrupar por categoria/estabelecimento/tag/conta), Importar (CSV/XLSX/OFX + leitura de notificações do banco), Configurações (tema, Google, exportar CSV), Excluir minha conta.

Restrições: **tudo grátis**, poucos usuários (um lar), segurança e performance como prioridade.

## Decisões de produto

- **Lar compartilhado**: cada membro do lar tem o próprio login; um usuário pertence a um único lar.
- **Visibilidade**: conta/cartão é **Compartilhada** (todos do lar veem) ou **Só minha** (só o dono vê a conta e seus lançamentos). Lançamentos herdam a visibilidade da conta, inclusive importados. Categorias, estabelecimentos e tags são do lar. Início e Gráficos têm filtro **Lar · Só eu**.
  Regra de acesso: `household_id = meu lar AND (visibility = SHARED OR owner_id = eu)`, aplicada nas consultas **e** em Row-Level Security no PostgreSQL.
- **Só Android**, APK distribuído direto (sem Play Store). iOS fora de escopo.
- **Lançamentos**: manual (principal), importação CSV/XLSX/OFX e leitura de notificações do banco. Importados e notificações vão para a fila "Para revisar" — nada entra sem confirmação. Detectar duplicidade entre as três origens.
- **Sem push e sem email de aviso.** Email só de sistema (verificação de cadastro e recuperação de senha). O alerta de 80% do limite da categoria aparece dentro do app.

## Stack

### App (React Native)

| Função                | Ferramenta                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Base                  | Expo SDK (última) + New Architecture, TypeScript estrito, dev build (não Expo Go, por causa do módulo nativo)        |
| Navegação             | Expo Router (abas: Início, Contas, +, Gráficos, Cadastros)                                                           |
| Dados do servidor     | TanStack Query                                                                                                       |
| Estado local          | Zustand                                                                                                              |
| Formulários           | React Hook Form + Zod (schemas compartilhados com o web)                                                             |
| Estilo / tema         | react-native-unistyles 3 com os tokens do design (claro/escuro/sistema)                                              |
| Gráficos              | Victory Native XL (Skia)                                                                                             |
| Auth                  | expo-auth-session (Authorization Code + PKCE) + expo-secure-store (Keystore) + expo-local-authentication (biometria) |
| Importar arquivo      | expo-document-picker; parsing no backend                                                                             |
| Notificações do banco | Módulo Expo nativo em Kotlin (`NotificationListenerService`)                                                         |
| Cliente da API        | orval, gerado do OpenAPI da API (`packages/api-client`)                                                              |
| Testes                | Jest + React Native Testing Library; E2E com Maestro                                                                 |
| Qualidade             | Biome; Sentry (plano grátis)                                                                                         |
| Build                 | EAS Build (plano grátis) gerando APK; fallback `eas build --local`                                                   |

### Backend

- Java 25 + Spring Boot 4, Maven Wrapper (`./mvnw`), virtual threads.
- **Monólito modular** com Spring Modulith — microsserviços seriam custo sem benefício para um lar; os módulos podem virar serviços depois.
- Spring Security OAuth2 Resource Server (JWT do Keycloak: issuer, audience `bruzfin-api`, JWKS, `email_verified`).
- Spring Data JPA + Flyway; springdoc-openapi (contrato versionado em `packages/api-client/openapi.json` e verificado por teste).
- Spring Kafka com Transactional Outbox (event publication registry do Modulith).
- Testcontainers, ArchUnit, JUnit 5, jMolecules.
- Actuator + Micrometer + OpenTelemetry → Grafana Cloud (plano grátis).
- Erros em Problem Details (RFC 9457); rate limit Bucket4j + Valkey (fail-open).

### Dados e segurança

- **PostgreSQL 18**: ACID, `NUMERIC(19,2)` para dinheiro, agregações para os gráficos, RLS por `household_id` como segunda barreira.
- **Valkey 8** (fork open source do Redis, mesma API): cache das agregações, rate limit, chaves de idempotência.
- **Kafka 4 KRaft** (1 broker): importação assíncrona, sugestões vindas de notificações, exclusão de conta e exportação de dados.
- **Keycloak 26**: email/senha com verificação e recuperação, Google como Identity Provider, MFA opcional, proteção contra força bruta. Tela de login com **Keycloakify** reproduzindo `App-Login`. Emails via **Brevo** (300/dia grátis); Mailpit no ambiente local.
- **Cloudflare Tunnel**: o servidor não abre porta para a internet; TLS e proteção DDoS da Cloudflare. Domínio: subdomínio grátis ou um `.com.br` barato (decisão pendente).

## Nuvem: Oracle Cloud Always Free

Única opção grátis permanente que comporta tudo junto: VM ARM Ampere **4 OCPU / 24 GB RAM**, 200 GB de disco, 20 GB de Object Storage, 10 TB de tráfego/mês.

Orçamento de RAM: PostgreSQL 2 GB · Keycloak 1 GB · Kafka 1,5 GB · Valkey 256 MB · API 1 GB · cloudflared/observabilidade ~1 GB → sobra bastante.

Cuidados:
- Converter a conta para **Pay-As-You-Go** (continua R$ 0 dentro do Always Free e evita que a Oracle recupere VMs ociosas) e configurar **alerta de orçamento em US$ 1**.
- Região São Paulo (`sa-saopaulo-1`) ou Vinhedo; se faltar capacidade ARM na criação, tentar em outro horário ou na outra região.
- Orquestração com **Docker Compose** na VM (k3s fica como evolução).
- Backup: `pg_dump` diário criptografado com **age** → Oracle Object Storage, com teste de restauração.

### Por que Oracle (comparação feita no planejamento)

| Camada   | Alternativa                | Plano grátis                                     | Veredito                                            |
| -------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| API      | Fly.io                     | Sem plano grátis para contas novas desde 2024    | Descartado                                          |
| API      | Koyeb                      | 1 serviço, 512 MB, 0,1 vCPU, dorme quando ocioso | Spring Boot apertado, cold start; Keycloak não cabe |
| Postgres | Neon                       | 0,5 GB, escala a zero                            | Muito bom; **plano B do banco**                     |
| Postgres | Supabase                   | 500 MB, pausa após 7 dias sem uso                | Pausa é ruim para app pessoal                       |
| Redis    | Upstash Redis              | 256 MB, ~500 mil comandos/mês                    | Suficiente, mas adiciona latência externa           |
| Broker   | Upstash Kafka              | Encerrado em 2025                                | Não existe mais                                     |
| Broker   | Upstash QStash / CloudAMQP | Fila HTTP / RabbitMQ                             | Não é Kafka                                         |
| Web      | **Vercel Hobby**           | Grátis, uso não comercial                        | **Adotado para o Next.js**                          |
| Nuvem    | AWS                        | Free tier virou crédito temporário de 6 meses    | Descartado                                          |

Decisão: API, PostgreSQL, Valkey, Kafka e Keycloak na Oracle (sem cold start, sem pausa, latência interna); web na Vercel. Contrapartida aceita: uma VM só, e nós cuidamos de atualizações, backup e segurança.

## CI/CD (GitHub Actions)

Já implementado (Fase 1):
- `mobile.yml`: Biome, typecheck, Jest e verificação de que o cliente gerado pelo orval está em dia.
- `api.yml`: `./mvnw verify` (Testcontainers + ArchUnit + contrato OpenAPI).
- `security.yml`: CodeQL e gitleaks; Dependabot com cooldown de 7 dias.
- Actions fixadas por SHA; filtros de caminho com jobs-portão (`mobile-ok`, `api-ok`, `security-ok`) exigidos pelo ruleset da `main` (PR obrigatória, sem bypass, CodeQL sem alertas high+).

Previsto:
- Imagem Docker multi-arch (ARM) da API com **Jib** (plugin Maven) → **GHCR**; scan com **Trivy**.
- Deploy via SSH pela rede do **Tailscale**: `docker compose pull && docker compose up -d` na VM.
- Tag `app-v*` dispara `eas build --profile preview` (APK).

## Arquitetura

### Monorepo (pnpm workspaces + Turborepo)

```
apps/mobile/            # Expo
apps/web/               # Next.js (depois)
packages/core/          # domínio + casos de uso em TS puro
packages/api-client/    # gerado pelo orval
packages/design-tokens/ # tokens do design system
packages/config/        # tsconfig e Biome base
services/api/           # Spring Boot (Maven)
infra/compose/          # Docker Compose, realm do Keycloak, cloudflared
infra/keycloak-theme/   # Keycloakify
```

### Backend hexagonal por módulo Modulith

Módulos: `identity` (usuário provisionado a partir do token), `household` (lar, membros, convite), `accounts` (contas e cartões), `transactions` (lançamentos), `catalog` (categorias, estabelecimentos, tags, regras de auto-tag), `imports` (CSV/XLSX/OFX, notificações), `insights` (gráficos, agregações, limites), `privacy` (exportação e exclusão — LGPD). Infra transversal em `platform` (security, ratelimit, health) e utilitários em `shared`.

```
<modulo>/domain/                # Java puro, sem Spring
<modulo>/application/port/in/   # casos de uso
<modulo>/application/port/out/  # repositórios, publicadores
<modulo>/application/service/
<modulo>/adapter/in/web/
<modulo>/adapter/out/persistence/
<modulo>/adapter/out/messaging/
```

ArchUnit garante: `domain` não depende de Spring nem de `adapter`; `application` não depende de `adapter`; módulos só se falam pela API pública ou por eventos.
Padrões: Strategy (parsers CSV/XLSX/OFX), Chain of Responsibility (auto-tag), Factory, Adapter, Outbox, Specification (filtros de lançamentos).

### App com clean architecture

- `packages/core/domain`: `Money` (centavos inteiros, nunca float), `Transaction`, `Account`, regras de tag.
- `packages/core/application`: casos de uso + portas (`AuthGateway`, `TokenStorage`, `TransactionGateway`).
- `apps/mobile/src/infrastructure`: adapters (cliente orval, SecureStore, módulo de notificações).
- `apps/mobile/src/presentation`: telas do Expo Router, componentes, hooks.
- DI por composition root (contexto React) — telas não conhecem HTTP.

## Segurança

- OAuth2 Authorization Code + PKCE (sem password grant, sem implicit); o app nunca vê a senha.
- Access token de 5 min; refresh token com rotação e revogação.
- Tokens só no Keystore (SecureStore); biometria opcional para reabrir o app; `FLAG_SECURE`.
- Toda consulta filtrada por lar + visibilidade, reforçada por RLS.
- Rate limit por usuário/IP; Bean Validation; IDs UUIDv7; logs sem dados financeiros nem tokens.
- CORS restrito; exclusão de conta e exportação (LGPD) como fluxos assíncronos via Kafka.

## Fases (cada fase = um épico no Jira KAN)

| #   | Épico  | Fase                                                                                                                                                                                  | Estado       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | KAN-4  | **Fundação** — monorepo, Biome/tsconfig, design-tokens, app com tema e abas, esqueleto da API com Modulith + ArchUnit, Docker Compose local, CI                                       | Concluída    |
| 2   | KAN-5  | **Autenticação e lar (local)** — realm Keycloak, Brevo, Keycloakify igual ao `App-Login`, cadastro, login com PKCE, recuperar senha, Google, `/me`, sessão segura, convite para o lar | Em andamento |
| 3   | KAN-6  | **Infra na nuvem** — conta Oracle, VM ARM, hardening, Docker, Tailscale, Cloudflare Tunnel, deploy automático, backup. A partir daqui o APK usa o servidor real                       | A detalhar   |
| 4   | KAN-7  | **Contas e cartões** — `App-Contas`, `App-ContaForm` (limite, fechamento, vencimento, saldo inicial, visibilidade)                                                                    | A detalhar   |
| 5   | KAN-8  | **Cadastros** — categorias (ícones, limite mensal), estabelecimentos (nome no extrato, tags padrão), tags                                                                             | A detalhar   |
| 6   | KAN-9  | **Lançamentos + Início** — nova/editar/excluir compra e entrada manual, tags automáticas, Início com saldo, gastos por categoria e aviso de 80%                                       | A detalhar   |
| 7   | KAN-10 | **Gráficos** — agregações no backend com cache Valkey, `App-Graficos` e `App-GraficoForm`                                                                                             | A detalhar   |
| 8   | KAN-11 | **Importação e notificações** — upload CSV/XLSX/OFX → Kafka → revisão; módulo Kotlin de notificações com fila "Para revisar"; duplicidade entre as três origens                       | A detalhar   |
| 9   | KAN-12 | **Configurações e privacidade** — tema, conectar/desconectar Google, alterar email/senha, exportar CSV, excluir conta                                                                 | A detalhar   |
| 10  | KAN-13 | **Endurecimento e release 1.0** — E2E Maestro, observabilidade, revisão de segurança, release do APK                                                                                  | A detalhar   |

Os tickets de cada fase são detalhados no Jira ao chegar nela: épico = fase; História/Tarefa = entrega testável com critérios de aceite tirados da tela do design; tarefas técnicas como checklist na descrição. O estado atual de cada ticket está no Jira — este documento não é atualizado a cada ticket.

## Verificação por fase

- **Fase 1**: `pnpm turbo lint typecheck test` verde; `./mvnw verify` verde; `docker compose up` com todos os serviços `healthy`; app abre no emulador com tema claro/escuro igual ao design.
- **Fase 2**: cadastro com verificação por email, recuperação de senha, login com email e com Google no emulador; token salvo no SecureStore; `/me` retorna o usuário; token expirado renova sozinho; convite coloca o segundo usuário no lar.
- **Fase 3**: API e Keycloak acessíveis por HTTPS via Cloudflare Tunnel sem portas abertas na VM; deploy automático a cada merge na `main`; backup restaurado com sucesso num banco limpo; APK de preview logando no servidor real.
- **Fases seguintes**: testes de caso de uso (domínio puro), testes de integração com Testcontainers, E2E Maestro do fluxo da tela e comparação visual com a tela do design.

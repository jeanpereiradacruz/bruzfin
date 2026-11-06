# services/api

API do BruzFin: **Java 25** + **Spring Boot 4.1** (Maven), monólito modular com **Spring Modulith 2.1** e arquitetura hexagonal.

## Estrutura

Cada subpacote direto de `com.bruzfin.api` é um módulo (Spring Modulith). Dentro de cada módulo:

```
<modulo>/
  domain/                  # modelo puro (records, value objects) — sem Spring, JPA ou Jackson
  application/
    port/in/               # casos de uso oferecidos (interfaces)
    port/out/              # o que o módulo precisa de fora (repositórios, publicadores)
    service/               # implementação dos casos de uso — sem Spring (só @Transactional)
  adapter/
    in/web/                # controllers REST + DTOs
    out/persistence/       # entidades JPA e repositórios
    out/messaging/         # Kafka
    config/                # @Configuration que liga casos de uso e adapters
```

O módulo `about` (`GET /api/v1/about`) é o exemplo de referência. Módulos atuais:

| Módulo | O que faz |
|---|---|
| `identity` | usuário da API, criado no primeiro acesso a partir do token (`GET /api/v1/me`) |
| `about` | nome e versão da API |
| `platform` | técnico, sem regra de negócio: segurança (Resource Server), rate limit, OpenAPI, health check do Kafka |
| `shared` | núcleo compartilhado (aberto): `UuidV7` |

## Segurança

- **OAuth2 Resource Server**: toda rota exige access token do realm `bruzfin`, exceto `/actuator/health/**` (e `/v3/api-docs` quando `bruzfin.security.public-api-docs=true`, ligado só no profile `local`).
- Valida assinatura (JWKS do Keycloak, com cache), validade (tolerância de 60 s), emissor (`bruzfin.security.issuer-uri` / `BRUZFIN_AUTH_ISSUER_URI`, obrigatório) e audience `bruzfin-api`.
- Exige `email_verified=true`, `sub` e `email` no token: sem token **401**, email não confirmado **403**. Erros em Problem Details (RFC 9457), sem stack trace e sem ecoar o token.
- Sem sessão, sem CSRF (só Bearer), CORS desligado até existir o web (`bruzfin.security.cors-allowed-origins`), CSP `default-src 'none'`.
- **Rate limit** (Bucket4j no Valkey): 120 req/min por usuário e 30 req/min por IP sem token; excesso responde **429** com `Retry-After`. Se o Valkey cair, as requisições passam e o problema vai para o log (fail-open).

## Regras verificadas no build

- **ArchUnit** (`HexagonalArchitectureTest`): domínio puro; aplicação sem adapters e sem framework; adapters de entrada e saída independentes; controllers só em `adapter.in.web`; entidades JPA só em `adapter.out.persistence`. Cada regra também é testada contra um exemplo com violações (`com.bruzfin.archfixture`), para garantir que ela realmente pega o erro.
- **Spring Modulith** (`ModularityTest`): módulos sem ciclos e só pela API pública.
- Compilação com `-Xlint:all -Werror`.

## Comandos

```bash
./mvnw verify                      # compila, testes unitários, arquitetura e integração
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # precisa do Docker Compose (infra/README.md)
```

- Testes de integração (`*IT`) usam **Testcontainers** com Keycloak 26 (mesmo realm do compose), PostgreSQL 18, Valkey 8 e Kafka 4, nas mesmas versões do compose (`TestcontainersConfiguration`), e precisam de Docker. Sem Docker eles são pulados. Os tokens são obtidos pelo mesmo fluxo do app (Authorization Code + PKCE, `KeycloakPkce`).
- **Contrato OpenAPI**: o `BruzfinApiApplicationIT` compara o `/v3/api-docs` com `packages/api-client/openapi.json`. Mudou a API? `./mvnw verify -Dbruzfin.openapi.update=true` e depois `pnpm --filter @bruzfin/api-client generate`.
- O profile `local` lê `BRUZFIN_DB_*`, `BRUZFIN_VALKEY_*` e `BRUZFIN_KAFKA_BOOTSTRAP_SERVERS`. Os padrões batem com o `infra/compose/.env.example`.
- O Maven Wrapper baixa o Maven 3.10.0 e confere o SHA-256 da distribuição.

## Endpoints

| Rota | Descrição |
|---|---|
| `GET /api/v1/me` | perfil do usuário autenticado (criado no primeiro acesso) |
| `GET /api/v1/about` | nome e versão da API |
| `GET /actuator/health` | health check (com probes `liveness`/`readiness`); no profile `local` mostra `db`, `redis` (Valkey) e `kafka` |
| `GET /v3/api-docs` | contrato OpenAPI (usado pelo orval para gerar o cliente do app); sem token só no profile `local` |

## Banco

Migrações Flyway em `src/main/resources/db/migration`. `V1` cria a tabela `event_publication` do registro de eventos do Spring Modulith (Transactional Outbox); `V2` cria `app_user` (id UUIDv7, `keycloak_sub` único, email, nome). O Hibernate só valida o schema (`ddl-auto: validate`).

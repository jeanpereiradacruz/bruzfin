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

O módulo `about` (`GET /api/v1/about`) é o exemplo de referência.

## Regras verificadas no build

- **ArchUnit** (`HexagonalArchitectureTest`): domínio puro; aplicação sem adapters e sem framework; adapters de entrada e saída independentes; controllers só em `adapter.in.web`; entidades JPA só em `adapter.out.persistence`. Cada regra também é testada contra um exemplo com violações (`com.bruzfin.archfixture`), para garantir que ela realmente pega o erro.
- **Spring Modulith** (`ModularityTest`): módulos sem ciclos e só pela API pública.
- Compilação com `-Xlint:all -Werror`.

## Comandos

```bash
./mvnw verify                      # compila, testes unitários, arquitetura e integração
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # precisa do PostgreSQL (KAN-19)
```

- Testes de integração (`*IT`) usam **Testcontainers** com PostgreSQL 18 e precisam de Docker; sem Docker eles são pulados.
- O Maven Wrapper baixa o Maven 3.10.0 e confere o SHA-256 da distribuição.

## Endpoints

| Rota | Descrição |
|---|---|
| `GET /api/v1/about` | nome e versão da API |
| `GET /actuator/health` | health check (com probes `liveness`/`readiness`) |
| `GET /v3/api-docs` | contrato OpenAPI (usado pelo orval para gerar o cliente do app) |

## Banco

Migrações Flyway em `src/main/resources/db/migration`. `V1` cria a tabela `event_publication` do registro de eventos do Spring Modulith (Transactional Outbox). O Hibernate só valida o schema (`ddl-auto: validate`).

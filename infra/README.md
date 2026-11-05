# infra

- `compose/` — Docker Compose do ambiente local (KAN-19). A versão da nuvem vem na fase 3 (KAN-6).
- `keycloak-theme/` — tema de login com Keycloakify. Ticket **KAN-23**.

## Ambiente local

```bash
cp infra/compose/.env.example infra/compose/.env   # só na primeira vez
docker compose -f infra/compose/docker-compose.yml up -d
docker compose -f infra/compose/docker-compose.yml ps    # todos devem ficar "healthy" (~1 min)
```

Depois, a API: `cd services/api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local`.

| Serviço    | Imagem                             | Na máquina                          | Para que serve                                                  |
| ---------- | ---------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| PostgreSQL | `postgres:18.6-alpine`             | `localhost:5432`                    | bancos `bruzfin` (API) e `keycloak`                             |
| Valkey     | `valkey/valkey:8.1.11-alpine`      | `localhost:6379`                    | cache e rate limit (com senha)                                  |
| Kafka      | `apache/kafka:4.3.2`               | `localhost:9092`                    | eventos (KRaft, 1 broker; outros containers usam `kafka:19092`) |
| Keycloak   | `quay.io/keycloak/keycloak:26.8.2` | http://localhost:8180               | login (console admin com usuário/senha do `.env`)               |
| Mailpit    | `axllent/mailpit:v1.33.0`          | http://localhost:8025 (SMTP `1025`) | caixa de email local                                            |

- **Portas só em `127.0.0.1`**: nada fica exposto na rede.
- **Bancos separados**: o script `compose/postgres/init/01-databases.sh` cria os usuários `bruzfin` e `keycloak`, cada um dono só do seu banco e **sem superusuário**. Isso importa porque superusuário ignora a Row-Level Security. O script só roda quando o volume é criado pela primeira vez.
- **Senhas**: vêm do `.env`, que não é versionado. Se faltar alguma, o compose para com erro. Os valores do `.env.example` são os mesmos padrões do profile `local` da API.
- **ARM**: todas as imagens publicam `amd64` e `arm64`, as mesmas que vão rodar na VM ARM da Oracle.
- **Kafka**: `auto.create.topics.enable=false`. Os tópicos serão criados explicitamente pela API.
- Os dados ficam nos volumes `bruzfin_postgres-data`, `bruzfin_valkey-data` e `bruzfin_kafka-data`.

```bash
docker compose -f infra/compose/docker-compose.yml down      # para (mantém os dados)
docker compose -f infra/compose/docker-compose.yml down -v   # para e APAGA os dados
```

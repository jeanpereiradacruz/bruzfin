package com.bruzfin.api;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Infraestrutura real para os testes de integração, nas mesmas versões do Docker Compose local.
 *
 * <p>Os containers são beans: o Spring fecha a aplicação antes de parar os containers,
 * então nenhum cliente (Hikari, Lettuce, Kafka) fica tentando reconectar no desligamento.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    /** Usuário da API no banco de teste: dono das tabelas, mas sem superusuário (como no compose e na nuvem). */
    public static final String APP_DB_USER = "bruzfin";
    public static final String APP_DB_PASSWORD = "bruzfin-test";

    /**
     * PostgreSQL com o usuário {@code bruzfin} sem superusuário: superusuário ignora a Row-Level Security,
     * então a API dos testes usa o mesmo tipo de usuário de produção.
     */
    @Bean
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer("postgres:18.6-alpine")
                .withInitScript("db/test-app-role.sql");
    }

    @Bean
    DynamicPropertyRegistrar appDatabase(PostgreSQLContainer postgres) {
        return registry -> {
            registry.add("spring.datasource.url", () -> appJdbcUrl(postgres));
            registry.add("spring.datasource.username", () -> APP_DB_USER);
            registry.add("spring.datasource.password", () -> APP_DB_PASSWORD);
        };
    }

    public static String appJdbcUrl(PostgreSQLContainer postgres) {
        return "jdbc:postgresql://" + postgres.getHost() + ":" + postgres.getMappedPort(5432) + "/bruzfin";
    }

    /** Valkey fala o protocolo Redis: o Spring Boot o configura como uma conexão "redis". */
    @Bean
    @ServiceConnection(name = "redis")
    GenericContainer<?> valkeyContainer() {
        return new GenericContainer<>("valkey/valkey:8.1.11-alpine").withExposedPorts(6379);
    }

    @Bean
    @ServiceConnection
    KafkaContainer kafkaContainer() {
        return new KafkaContainer("apache/kafka:4.3.2");
    }

    /** Keycloak com o mesmo realm do compose (e o usuário de teste do ambiente local). */
    @Bean
    KeycloakContainer keycloakContainer() {
        return new KeycloakContainer("quay.io/keycloak/keycloak:26.8.2")
                .withRealmImportFiles("/keycloak/bruzfin-realm.json", "/keycloak/dev/bruzfin-users-0.json");
    }

    @Bean
    DynamicPropertyRegistrar keycloakIssuer(KeycloakContainer keycloak) {
        return registry -> registry.add("bruzfin.security.issuer-uri",
                () -> keycloak.getAuthServerUrl() + "/realms/bruzfin");
    }
}

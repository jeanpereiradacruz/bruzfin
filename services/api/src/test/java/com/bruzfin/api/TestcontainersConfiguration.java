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

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer("postgres:18.6-alpine");
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

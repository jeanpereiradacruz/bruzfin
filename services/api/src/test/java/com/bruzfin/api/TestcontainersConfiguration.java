package com.bruzfin.api;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
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
}

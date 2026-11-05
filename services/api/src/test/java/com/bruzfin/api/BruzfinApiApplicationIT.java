package com.bruzfin.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Sobe a API inteira contra PostgreSQL 18, Valkey 8 e Kafka 4 reais ({@link TestcontainersConfiguration}).
 * Sem Docker na máquina o teste é pulado; no CI ele sempre roda.
 */
@Testcontainers(disabledWithoutDocker = true)
// Em produção os componentes do health ficam ocultos; o teste os expõe para conferir cada conexão.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "management.endpoint.health.show-components=always")
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
@DisplayName("API completa com PostgreSQL, Valkey e Kafka")
class BruzfinApiApplicationIT {

    @Autowired
    private RestTestClient client;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("Flyway cria a tabela de eventos do Modulith")
    void flywayCreatesEventPublicationTable() {
        Integer tables = jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_name = 'event_publication'",
                Integer.class);
        assertThat(tables).isEqualTo(1);
    }

    @Test
    @DisplayName("health check responde UP")
    void healthIsUp() {
        client.get().uri("/actuator/health").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.status").isEqualTo("UP");
    }

    @ParameterizedTest(name = "componente {0} do health check está UP")
    @ValueSource(strings = {"db", "redis", "kafka"})
    @DisplayName("conecta no PostgreSQL, no Valkey e no Kafka")
    void infrastructureIsUp(String component) {
        client.get().uri("/actuator/health/{component}", component).exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.status").isEqualTo("UP");
    }

    @Test
    @DisplayName("expõe nome e versão em /api/v1/about")
    void aboutEndpoint() {
        client.get().uri("/api/v1/about").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.name").isEqualTo("BruzFin API");
    }

    @Test
    @DisplayName("publica o contrato OpenAPI")
    void openApiIsPublished() {
        client.get().uri("/v3/api-docs").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.paths['/api/v1/about']").exists();
    }
}

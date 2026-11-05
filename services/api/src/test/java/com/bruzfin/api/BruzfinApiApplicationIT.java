package com.bruzfin.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Sobe a API inteira contra um PostgreSQL 18 real (Testcontainers).
 * Sem Docker na máquina o teste é pulado; no CI ele sempre roda.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@DisplayName("API completa com PostgreSQL")
class BruzfinApiApplicationIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:18-alpine");

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

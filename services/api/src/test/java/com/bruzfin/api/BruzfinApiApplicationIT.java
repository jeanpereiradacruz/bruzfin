package com.bruzfin.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.bruzfin.api.support.KeycloakPkce;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Sobe a API inteira contra Keycloak 26, PostgreSQL 18, Valkey 8 e Kafka 4 reais ({@link TestcontainersConfiguration}),
 * usando tokens emitidos pelo realm {@code bruzfin} pelo mesmo fluxo do app.
 * Sem Docker na máquina o teste é pulado; no CI ele sempre roda.
 */
@Testcontainers(disabledWithoutDocker = true)
// Os componentes do health ficam ocultos em produção; o teste os expõe para conferir cada conexão.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "management.endpoint.health.show-components=always",
        "bruzfin.security.public-api-docs=true"})
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
@DisplayName("API completa com Keycloak, PostgreSQL, Valkey e Kafka")
class BruzfinApiApplicationIT {

    /** Contrato consumido pelo orval no app; atualize com {@code ./mvnw verify -Dbruzfin.openapi.update=true}. */
    private static final Path OPENAPI_CONTRACT = Path.of("../../packages/api-client/openapi.json");

    @Autowired
    private RestTestClient client;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private KeycloakContainer keycloak;

    private String accessToken;

    @BeforeEach
    void login() {
        accessToken = new KeycloakPkce(keycloak.getAuthServerUrl()).accessToken();
    }

    @Test
    @DisplayName("Flyway cria as tabelas de eventos do Modulith e de usuários")
    void flywayCreatesTables() {
        Integer tables = jdbc.queryForObject("""
                select count(*) from information_schema.tables
                where table_name in ('event_publication', 'app_user')""", Integer.class);
        assertThat(tables).isEqualTo(2);
    }

    @Test
    @DisplayName("health check responde UP sem token")
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
    @DisplayName("GET /api/v1/me cria o usuário no primeiro acesso e só uma vez")
    void meProvisionsUserOnce() {
        for (int i = 0; i < 2; i++) {
            client.get().uri("/api/v1/me").header("Authorization", "Bearer " + accessToken).exchange()
                    .expectStatus().isOk()
                    .expectBody()
                    .jsonPath("$.email").isEqualTo(KeycloakPkce.TEST_USER)
                    .jsonPath("$.name").isEqualTo("Usuário de Teste")
                    .jsonPath("$.id").isNotEmpty()
                    .jsonPath("$.household").doesNotExist();
        }
        String subject = KeycloakPkce.claims(accessToken).get("sub").asString();
        Integer users = jdbc.queryForObject(
                "select count(*) from app_user where keycloak_sub = ?", Integer.class, subject);
        assertThat(users).isEqualTo(1);
    }

    @Test
    @DisplayName("rotas da API exigem token")
    void apiRequiresToken() {
        client.get().uri("/api/v1/me").exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().valueMatches("WWW-Authenticate", "Bearer.*");
    }

    @Test
    @DisplayName("token com assinatura adulterada responde 401")
    void tamperedTokenIsRejected() {
        String[] parts = accessToken.split("\\.");
        String forgedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                KeycloakPkce.claims(accessToken).toString().replace(KeycloakPkce.TEST_USER, "outra@bruzfin.local")
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String forged = parts[0] + "." + forgedPayload + "." + parts[2];

        client.get().uri("/api/v1/me").header("Authorization", "Bearer " + forged).exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("expõe nome e versão em /api/v1/about para quem tem token")
    void aboutEndpoint() {
        client.get().uri("/api/v1/about").header("Authorization", "Bearer " + accessToken).exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.name").isEqualTo("BruzFin API");
    }

    @Test
    @DisplayName("contrato OpenAPI publicado é o mesmo de packages/api-client/openapi.json")
    void openApiContractIsUpToDate() throws Exception {
        String published = client.get().uri("/v3/api-docs").exchange()
                .expectStatus().isOk()
                .returnResult(String.class).getResponseBody();
        JsonMapper json = JsonMapper.builder().enable(SerializationFeature.INDENT_OUTPUT).build();
        JsonNode actual = json.readTree(published);

        assertThat(actual.at("/components/securitySchemes/bearer/scheme").asString()).isEqualTo("bearer");
        if (Boolean.getBoolean("bruzfin.openapi.update")) {
            Files.writeString(OPENAPI_CONTRACT, json.writeValueAsString(actual) + "\n");
        }
        assertThat(Files.exists(OPENAPI_CONTRACT))
                .as("gere o contrato com ./mvnw verify -Dbruzfin.openapi.update=true")
                .isTrue();
        assertThat(json.readTree(Files.readString(OPENAPI_CONTRACT)))
                .as("contrato desatualizado: rode ./mvnw verify -Dbruzfin.openapi.update=true e o pnpm generate")
                .isEqualTo(actual);
    }
}

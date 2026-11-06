package com.bruzfin.api.platform.ratelimit;

import com.bruzfin.api.TestcontainersConfiguration;
import com.bruzfin.api.support.KeycloakPkce;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Rate limit de verdade no Valkey, com limites baixos só para o teste. */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "bruzfin.rate-limit.authenticated-capacity=3",
        "bruzfin.rate-limit.anonymous-capacity=2",
        "bruzfin.rate-limit.period=1h"})
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
@DisplayName("Rate limit no Valkey")
class RateLimitIT {

    @Autowired
    private RestTestClient client;

    @Autowired
    private KeycloakContainer keycloak;

    @Test
    @DisplayName("usuário autenticado recebe 429 com Retry-After ao passar do limite")
    void limitsAuthenticatedUser() {
        String token = new KeycloakPkce(keycloak.getAuthServerUrl()).accessToken();
        for (int i = 0; i < 3; i++) {
            client.get().uri("/api/v1/me").header("Authorization", "Bearer " + token).exchange()
                    .expectStatus().isOk();
        }
        client.get().uri("/api/v1/me").header("Authorization", "Bearer " + token).exchange()
                .expectStatus().isEqualTo(429)
                .expectHeader().exists("Retry-After")
                .expectBody().jsonPath("$.status").isEqualTo(429);
    }

    @Test
    @DisplayName("requisições sem token são limitadas por IP; o health check não entra na conta")
    void limitsAnonymousByIp() {
        for (int i = 0; i < 5; i++) {
            client.get().uri("/actuator/health").exchange().expectStatus().isOk();
        }
        client.get().uri("/api/v1/about").exchange().expectStatus().isUnauthorized();
        client.get().uri("/api/v1/about").exchange().expectStatus().isUnauthorized();
        client.get().uri("/api/v1/about").exchange()
                .expectStatus().isEqualTo(429)
                .expectHeader().exists("Retry-After");
    }
}

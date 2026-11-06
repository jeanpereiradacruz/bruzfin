package com.bruzfin.api.realm;

import static com.bruzfin.api.support.KeycloakPkce.CLIENT_ID;
import static com.bruzfin.api.support.KeycloakPkce.REDIRECT_URI;
import static com.bruzfin.api.support.KeycloakPkce.TEST_PASSWORD;
import static com.bruzfin.api.support.KeycloakPkce.TEST_USER;
import static org.assertj.core.api.Assertions.assertThat;

import com.bruzfin.api.support.KeycloakPkce;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;

/**
 * Garante as regras de segurança do realm {@code bruzfin} (KAN-21), importando o mesmo arquivo
 * usado pelo Docker Compose.
 */
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Realm bruzfin do Keycloak")
class KeycloakRealmIT {

    @Container
    static final KeycloakContainer KEYCLOAK = new KeycloakContainer("quay.io/keycloak/keycloak:26.8.2")
            .withRealmImportFiles("/keycloak/bruzfin-realm.json", "/keycloak/dev/bruzfin-users-0.json");

    private static KeycloakPkce keycloak;

    @BeforeAll
    static void client() {
        keycloak = new KeycloakPkce(KEYCLOAK.getAuthServerUrl());
    }

    @Test
    @DisplayName("login com PKCE emite access token de 5 min com audience bruzfin-api")
    void pkceLoginIssuesTokenForTheApi() {
        JsonNode claims = KeycloakPkce.claims(keycloak.accessToken());

        assertThat(claims.has("sub")).isTrue();
        assertThat(claims.get("email").asString()).isEqualTo(TEST_USER);
        assertThat(claims.get("email_verified").asBoolean()).isTrue();
        assertThat(audiences(claims)).contains("bruzfin-api");
        assertThat(claims.get("exp").asLong() - claims.get("iat").asLong()).isEqualTo(300);
        assertThat(claims.get("iss").asString()).endsWith("/realms/bruzfin");
    }

    @Test
    @DisplayName("refresh token é rotacionado e o reuso revoga a sessão")
    void refreshTokenReuseRevokesTheSession() {
        String first = keycloak.login().get("refresh_token").asString();

        HttpResponse<String> rotated = keycloak.token(Map.of("grant_type", "refresh_token", "refresh_token", first));
        assertThat(rotated.statusCode()).isEqualTo(200);
        String second = KeycloakPkce.json(rotated.body()).get("refresh_token").asString();
        assertThat(second).isNotEqualTo(first);

        assertThat(keycloak.token(Map.of("grant_type", "refresh_token", "refresh_token", first)).statusCode())
                .as("reuso do refresh antigo")
                .isEqualTo(400);
        assertThat(keycloak.token(Map.of("grant_type", "refresh_token", "refresh_token", second)).statusCode())
                .as("o refresh novo morre junto com a sessão")
                .isEqualTo(400);
    }

    @Test
    @DisplayName("password grant é recusado")
    void passwordGrantIsRejected() {
        HttpResponse<String> response = keycloak.token(Map.of(
                "grant_type", "password", "username", TEST_USER, "password", TEST_PASSWORD, "scope", "openid"));

        assertThat(response.statusCode()).isIn(400, 401);
        assertThat(KeycloakPkce.json(response.body()).get("error").asString()).isEqualTo("unauthorized_client");
    }

    @Test
    @DisplayName("Authorization Code sem PKCE é recusado")
    void authorizationCodeWithoutPkceIsRejected() {
        HttpResponse<String> response = keycloak.authorize(Map.of());

        assertThat(KeycloakPkce.loginFormAction(response.body())).as("não deve exibir o formulário de login").isNull();
        assertThat(KeycloakPkce.location(response)).doesNotContain("code=");
    }

    @Test
    @DisplayName("implicit flow é recusado")
    void implicitFlowIsRejected() {
        HttpResponse<String> response = keycloak.get(Map.of(
                "client_id", CLIENT_ID, "redirect_uri", REDIRECT_URI, "response_type", "token", "scope", "openid"));

        assertThat(KeycloakPkce.location(response)).doesNotContain("access_token=");
    }

    private static List<String> audiences(JsonNode claims) {
        JsonNode aud = claims.get("aud");
        return aud.isArray() ? aud.valueStream().map(JsonNode::asString).toList() : List.of(aud.asString());
    }
}

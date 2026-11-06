package com.bruzfin.api.realm;

import static org.assertj.core.api.Assertions.assertThat;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Garante as regras de segurança do realm {@code bruzfin} (KAN-21), importando o mesmo arquivo
 * usado pelo Docker Compose. Faz o fluxo do app (Authorization Code + PKCE) só com HTTP.
 */
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Realm bruzfin do Keycloak")
class KeycloakRealmIT {

    private static final String CLIENT_ID = "bruzfin-mobile";
    private static final String REDIRECT_URI = "bruzfin://auth/callback";
    private static final String USER = "usuario@bruzfin.local";
    private static final String PASSWORD = "Teste1234";

    @Container
    static final KeycloakContainer KEYCLOAK = new KeycloakContainer("quay.io/keycloak/keycloak:26.8.2")
            .withRealmImportFiles("/keycloak/bruzfin-realm.json", "/keycloak/dev/bruzfin-users-0.json");

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final SecureRandom RANDOM = new SecureRandom();

    private static String oidc;

    @BeforeAll
    static void endpoints() {
        oidc = KEYCLOAK.getAuthServerUrl() + "/realms/bruzfin/protocol/openid-connect";
    }

    @Test
    @DisplayName("login com PKCE emite access token de 5 min com audience bruzfin-api")
    void pkceLoginIssuesTokenForTheApi() throws Exception {
        JsonNode tokens = loginWithPkce();
        JsonNode claims = claims(tokens.get("access_token").asString());

        assertThat(claims.has("sub")).isTrue();
        assertThat(claims.get("email").asString()).isEqualTo(USER);
        assertThat(claims.get("email_verified").asBoolean()).isTrue();
        assertThat(audiences(claims)).contains("bruzfin-api");
        assertThat(claims.get("exp").asLong() - claims.get("iat").asLong()).isEqualTo(300);
        assertThat(claims.get("iss").asString()).endsWith("/realms/bruzfin");
    }

    @Test
    @DisplayName("refresh token é rotacionado e o reuso revoga a sessão")
    void refreshTokenReuseRevokesTheSession() throws Exception {
        String first = loginWithPkce().get("refresh_token").asString();

        HttpResponse<String> rotated = token(Map.of("grant_type", "refresh_token", "refresh_token", first));
        assertThat(rotated.statusCode()).isEqualTo(200);
        String second = JSON.readTree(rotated.body()).get("refresh_token").asString();
        assertThat(second).isNotEqualTo(first);

        assertThat(token(Map.of("grant_type", "refresh_token", "refresh_token", first)).statusCode())
                .as("reuso do refresh antigo")
                .isEqualTo(400);
        assertThat(token(Map.of("grant_type", "refresh_token", "refresh_token", second)).statusCode())
                .as("o refresh novo morre junto com a sessão")
                .isEqualTo(400);
    }

    @Test
    @DisplayName("password grant é recusado")
    void passwordGrantIsRejected() throws Exception {
        HttpResponse<String> response = token(Map.of(
                "grant_type", "password", "username", USER, "password", PASSWORD, "scope", "openid"));

        assertThat(response.statusCode()).isIn(400, 401);
        assertThat(JSON.readTree(response.body()).get("error").asString()).isEqualTo("unauthorized_client");
    }

    @Test
    @DisplayName("Authorization Code sem PKCE é recusado")
    void authorizationCodeWithoutPkceIsRejected() throws Exception {
        HttpResponse<String> response = authorize(Map.of());

        assertThat(loginFormAction(response.body())).as("não deve exibir o formulário de login").isNull();
        assertThat(location(response)).doesNotContain("code=");
    }

    @Test
    @DisplayName("implicit flow é recusado")
    void implicitFlowIsRejected() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(URI.create(oidc + "/auth?" + form(Map.of(
                "client_id", CLIENT_ID, "redirect_uri", REDIRECT_URI,
                "response_type", "token", "scope", "openid")))).GET().build());

        assertThat(location(response)).doesNotContain("access_token=");
    }

    // ---- fluxo do app, só com HTTP ----

    private static JsonNode loginWithPkce() throws Exception {
        String verifier = randomUrlSafe(48);
        String challenge = base64Url(MessageDigest.getInstance("SHA-256")
                .digest(verifier.getBytes(StandardCharsets.US_ASCII)));

        HttpResponse<String> page = authorize(Map.of("code_challenge", challenge, "code_challenge_method", "S256"));
        String action = loginFormAction(page.body());
        assertThat(action).as("formulário de login").isNotNull();

        HttpResponse<String> login = send(HttpRequest.newBuilder(URI.create(action))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Cookie", cookies(page))
                .POST(HttpRequest.BodyPublishers.ofString(form(Map.of("username", USER, "password", PASSWORD))))
                .build());
        String redirect = location(login);
        assertThat(redirect).startsWith(REDIRECT_URI);
        String code = query(URI.create(redirect)).get("code");

        HttpResponse<String> tokens = token(Map.of(
                "grant_type", "authorization_code", "code", code,
                "redirect_uri", REDIRECT_URI, "code_verifier", verifier));
        assertThat(tokens.statusCode()).isEqualTo(200);
        return JSON.readTree(tokens.body());
    }

    private static HttpResponse<String> authorize(Map<String, String> extra) throws Exception {
        Map<String, String> params = new LinkedHashMap<>(Map.of(
                "client_id", CLIENT_ID, "redirect_uri", REDIRECT_URI, "response_type", "code",
                "scope", "openid", "state", randomUrlSafe(8)));
        params.putAll(extra);
        return send(HttpRequest.newBuilder(URI.create(oidc + "/auth?" + form(params))).GET().build());
    }

    private static HttpResponse<String> token(Map<String, String> params) throws Exception {
        Map<String, String> body = new LinkedHashMap<>(params);
        body.put("client_id", CLIENT_ID);
        return send(HttpRequest.newBuilder(URI.create(oidc + "/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form(body)))
                .build());
    }

    private static HttpResponse<String> send(HttpRequest request) throws Exception {
        return HTTP.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private static String loginFormAction(String html) {
        Matcher matcher = Pattern.compile("<form[^>]*id=\"kc-form-login\"[^>]*action=\"([^\"]+)\"").matcher(html);
        return matcher.find() ? matcher.group(1).replace("&amp;", "&") : null;
    }

    /**
     * Os cookies de sessão do Keycloak 26 são {@code Secure}; o java.net não os reenvia por HTTP,
     * então o teste os repassa à mão (como o navegador faz em localhost).
     */
    private static String cookies(HttpResponse<?> response) {
        return response.headers().allValues("Set-Cookie").stream()
                .map(cookie -> cookie.split(";", 2)[0])
                .collect(Collectors.joining("; "));
    }

    private static String location(HttpResponse<?> response) {
        return response.headers().firstValue("Location").orElse("");
    }

    private static JsonNode claims(String jwt) {
        return JSON.readTree(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]));
    }

    private static List<String> audiences(JsonNode claims) {
        JsonNode aud = claims.get("aud");
        return aud.isArray() ? aud.valueStream().map(JsonNode::asString).toList() : List.of(aud.asString());
    }

    private static Map<String, String> query(URI uri) {
        return Pattern.compile("&").splitAsStream(uri.getRawQuery())
                .map(pair -> pair.split("=", 2))
                .collect(Collectors.toMap(
                        kv -> URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                        kv -> URLDecoder.decode(kv.length > 1 ? kv[1] : "", StandardCharsets.UTF_8),
                        (a, b) -> a));
    }

    private static String form(Map<String, String> params) {
        return params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    private static String randomUrlSafe(int bytes) {
        byte[] buffer = new byte[bytes];
        RANDOM.nextBytes(buffer);
        return base64Url(buffer);
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

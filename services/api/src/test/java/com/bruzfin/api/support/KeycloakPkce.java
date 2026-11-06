package com.bruzfin.api.support;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Faz o mesmo fluxo do app contra o realm {@code bruzfin} (Authorization Code + PKCE), só com HTTP.
 * Usado nos testes de integração para obter tokens reais do Keycloak.
 */
public final class KeycloakPkce {

    public static final String CLIENT_ID = "bruzfin-mobile";
    public static final String REDIRECT_URI = "bruzfin://auth/callback";
    public static final String TEST_USER = "usuario@bruzfin.local";
    public static final String TEST_PASSWORD = "Teste1234";

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final String oidc;

    public KeycloakPkce(String authServerUrl) {
        this.oidc = authServerUrl + "/realms/bruzfin/protocol/openid-connect";
    }

    /** Login completo do usuário de teste; devolve a resposta do endpoint de token. */
    public JsonNode login() {
        String verifier = randomUrlSafe(48);
        HttpResponse<String> page = authorize(Map.of("code_challenge", challenge(verifier), "code_challenge_method", "S256"));
        String action = loginFormAction(page.body());
        if (action == null) {
            throw new IllegalStateException("Formulário de login não encontrado");
        }
        HttpResponse<String> login = send(HttpRequest.newBuilder(URI.create(action))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Cookie", cookies(page))
                .POST(HttpRequest.BodyPublishers.ofString(form(Map.of("username", TEST_USER, "password", TEST_PASSWORD))))
                .build());
        String redirect = location(login);
        if (!redirect.startsWith(REDIRECT_URI)) {
            throw new IllegalStateException("Login não voltou para o app: " + login.statusCode());
        }
        HttpResponse<String> tokens = token(Map.of(
                "grant_type", "authorization_code", "code", query(URI.create(redirect)).get("code"),
                "redirect_uri", REDIRECT_URI, "code_verifier", verifier));
        if (tokens.statusCode() != 200) {
            throw new IllegalStateException("Troca do code falhou: " + tokens.statusCode());
        }
        return JSON.readTree(tokens.body());
    }

    public String accessToken() {
        return login().get("access_token").asString();
    }

    public HttpResponse<String> authorize(Map<String, String> extra) {
        Map<String, String> params = new LinkedHashMap<>(Map.of(
                "client_id", CLIENT_ID, "redirect_uri", REDIRECT_URI, "response_type", "code",
                "scope", "openid", "state", randomUrlSafe(8)));
        params.putAll(extra);
        return get(params);
    }

    public HttpResponse<String> get(Map<String, String> params) {
        return send(HttpRequest.newBuilder(URI.create(oidc + "/auth?" + form(params))).GET().build());
    }

    public HttpResponse<String> token(Map<String, String> params) {
        Map<String, String> body = new LinkedHashMap<>(params);
        body.put("client_id", CLIENT_ID);
        return send(HttpRequest.newBuilder(URI.create(oidc + "/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form(body)))
                .build());
    }

    public static JsonNode claims(String jwt) {
        return JSON.readTree(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]));
    }

    public static JsonNode json(String body) {
        return JSON.readTree(body);
    }

    public static String loginFormAction(String html) {
        Matcher matcher = Pattern.compile("<form[^>]*id=\"kc-form-login\"[^>]*action=\"([^\"]+)\"").matcher(html);
        return matcher.find() ? matcher.group(1).replace("&amp;", "&") : null;
    }

    public static String location(HttpResponse<?> response) {
        return response.headers().firstValue("Location").orElse("");
    }

    /**
     * Os cookies de sessão do Keycloak 26 são {@code Secure}; o java.net não os reenvia por HTTP,
     * então eles são repassados à mão (como o navegador faz em localhost).
     */
    private static String cookies(HttpResponse<?> response) {
        return response.headers().allValues("Set-Cookie").stream()
                .map(cookie -> cookie.split(";", 2)[0])
                .collect(Collectors.joining("; "));
    }

    private static HttpResponse<String> send(HttpRequest request) {
        try {
            return HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
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

    private static String challenge(String verifier) {
        try {
            return base64Url(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
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

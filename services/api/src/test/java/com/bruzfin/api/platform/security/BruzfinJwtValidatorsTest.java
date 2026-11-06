package com.bruzfin.api.platform.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;

@DisplayName("Validação do access token")
class BruzfinJwtValidatorsTest {

    private static final String ISSUER = "http://localhost:8180/realms/bruzfin";
    private final OAuth2TokenValidator<Jwt> validator = BruzfinJwtValidators.create(ISSUER, "bruzfin-api");

    @Test
    @DisplayName("aceita token do emissor certo, com audience bruzfin-api e dentro da validade")
    void acceptsValidToken() {
        assertThat(validator.validate(token(ISSUER, List.of("bruzfin-api"), Instant.now().plusSeconds(300))).hasErrors())
                .isFalse();
    }

    @Test
    @DisplayName("recusa token sem a audience bruzfin-api")
    void rejectsWrongAudience() {
        assertThat(validator.validate(token(ISSUER, List.of("account"), Instant.now().plusSeconds(300))).hasErrors())
                .isTrue();
    }

    @Test
    @DisplayName("recusa token de outro emissor")
    void rejectsWrongIssuer() {
        assertThat(validator.validate(token("http://evil.example/realms/bruzfin", List.of("bruzfin-api"),
                Instant.now().plusSeconds(300))).hasErrors()).isTrue();
    }

    @Test
    @DisplayName("recusa token expirado (além da tolerância de 60 s)")
    void rejectsExpiredToken() {
        assertThat(validator.validate(token(ISSUER, List.of("bruzfin-api"), Instant.now().minusSeconds(120))).hasErrors())
                .isTrue();
    }

    private static Jwt token(String issuer, List<String> audience, Instant expiresAt) {
        return Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuer(issuer)
                .audience(audience)
                .subject("sub-1")
                .issuedAt(expiresAt.minusSeconds(300))
                .expiresAt(expiresAt)
                .build();
    }
}

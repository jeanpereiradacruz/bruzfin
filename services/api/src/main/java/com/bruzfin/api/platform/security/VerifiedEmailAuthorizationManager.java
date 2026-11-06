package com.bruzfin.api.platform.security;

import java.util.function.Supplier;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

/**
 * Só libera tokens de usuários com email confirmado e com {@code sub} e {@code email} preenchidos.
 * Sem token: o Spring Security responde 401; com token de email não confirmado: 403.
 */
final class VerifiedEmailAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    @Override
    public AuthorizationResult authorize(
            Supplier<? extends Authentication> authentication, RequestAuthorizationContext context) {
        if (!(authentication.get() instanceof JwtAuthenticationToken token)) {
            return new AuthorizationDecision(false);
        }
        var jwt = token.getToken();
        boolean granted = Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))
                && hasText(jwt.getSubject())
                && hasText(jwt.getClaimAsString("email"));
        return new AuthorizationDecision(granted);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

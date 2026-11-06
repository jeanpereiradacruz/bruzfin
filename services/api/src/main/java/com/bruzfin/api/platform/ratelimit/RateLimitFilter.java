package com.bruzfin.api.platform.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Aplica o rate limit depois da autenticação: por usuário ({@code sub}) quando há token válido,
 * por IP quando não há. Excesso responde 429 com {@code Retry-After}.
 *
 * <p>Se o Valkey estiver fora do ar, a requisição passa (fail-open) e o problema vai para o log:
 * para um app de um lar, ficar sem a API é pior que ficar sem o limite por alguns minutos.
 */
public final class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final RateLimiter limiter;
    private final RateLimitProperties properties;

    public RateLimitFilter(RateLimiter limiter, RateLimitProperties properties) {
        this.limiter = limiter;
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/actuator/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String key;
        RateLimiter.Limit limit;
        if (authentication instanceof JwtAuthenticationToken token) {
            key = "rl:user:" + token.getName();
            limit = properties.authenticated();
        } else {
            key = "rl:ip:" + request.getRemoteAddr();
            limit = properties.anonymous();
        }

        RateLimiter.Decision decision;
        try {
            decision = limiter.tryConsume(key, limit);
        } catch (RuntimeException e) {
            log.warn("Rate limit indisponível, requisição liberada: {}", e.getClass().getSimpleName());
            chain.doFilter(request, response);
            return;
        }

        if (decision.allowed()) {
            chain.doFilter(request, response);
            return;
        }
        long retryAfterSeconds = Math.max(1, (decision.retryAfter().toMillis() + 999) / 1000);
        response.setStatus(429);
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSeconds));
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("""
                {"type":"about:blank","title":"Muitas requisições","status":429,\
                "detail":"Aguarde %d segundo(s) e tente de novo."}""".formatted(retryAfterSeconds));
    }
}

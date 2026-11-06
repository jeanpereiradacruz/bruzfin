package com.bruzfin.api.platform.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@DisplayName("Filtro de rate limit")
class RateLimitFilterTest {

    private final RateLimitProperties properties = new RateLimitProperties(true, 120, 30, Duration.ofMinutes(1));

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("limita por usuário quando há token")
    void keysByUser() throws Exception {
        FakeLimiter limiter = FakeLimiter.allowing();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(
                Jwt.withTokenValue("t").header("alg", "none").subject("sub-1").build()));

        MockHttpServletResponse response = run(new RateLimitFilter(limiter, properties), "/api/v1/me");

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(limiter.keys).containsExactly("rl:user:sub-1");
        assertThat(limiter.limits).containsExactly(new RateLimiter.Limit(120, Duration.ofMinutes(1)));
    }

    @Test
    @DisplayName("limita por IP quando não há token")
    void keysByIp() throws Exception {
        FakeLimiter limiter = FakeLimiter.allowing();

        run(new RateLimitFilter(limiter, properties), "/api/v1/me");

        assertThat(limiter.keys).containsExactly("rl:ip:127.0.0.1");
        assertThat(limiter.limits).containsExactly(new RateLimiter.Limit(30, Duration.ofMinutes(1)));
    }

    @Test
    @DisplayName("acima do limite responde 429 com Retry-After e não chama a API")
    void rejectsWith429() throws Exception {
        FakeLimiter limiter = new FakeLimiter(RateLimiter.Decision.reject(Duration.ofMillis(1500)), false);
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RateLimitFilter(limiter, properties).doFilter(request("/api/v1/me"), response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("2");
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(chain.getRequest()).as("a requisição não segue adiante").isNull();
    }

    @Test
    @DisplayName("se o Valkey falhar, deixa a requisição passar")
    void failsOpen() throws Exception {
        FakeLimiter limiter = new FakeLimiter(null, true);

        MockHttpServletResponse response = run(new RateLimitFilter(limiter, properties), "/api/v1/me");

        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("não limita o health check")
    void skipsHealth() throws Exception {
        FakeLimiter limiter = FakeLimiter.allowing();

        run(new RateLimitFilter(limiter, properties), "/actuator/health/readiness");

        assertThat(limiter.keys).isEmpty();
    }

    private static MockHttpServletResponse run(RateLimitFilter filter, String uri) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request(uri), response, new MockFilterChain());
        return response;
    }

    private static MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.setRemoteAddr("127.0.0.1");
        return request;
    }

    private static final class FakeLimiter implements RateLimiter {

        final List<String> keys = new ArrayList<>();
        final List<Limit> limits = new ArrayList<>();
        private final Decision decision;
        private final boolean fail;

        FakeLimiter(Decision decision, boolean fail) {
            this.decision = decision;
            this.fail = fail;
        }

        static FakeLimiter allowing() {
            return new FakeLimiter(Decision.allow(), false);
        }

        @Override
        public Decision tryConsume(String key, Limit limit) {
            if (fail) {
                throw new IllegalStateException("Valkey fora do ar");
            }
            keys.add(key);
            limits.add(limit);
            return decision;
        }
    }
}

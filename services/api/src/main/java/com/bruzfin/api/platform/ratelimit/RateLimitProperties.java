package com.bruzfin.api.platform.ratelimit;

import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Rate limit da API.
 *
 * @param enabled               liga ou desliga o limite
 * @param authenticatedCapacity requisições por período para cada usuário autenticado
 * @param anonymousCapacity     requisições por período para cada IP sem token
 * @param period                janela de reabastecimento
 */
@Validated
@ConfigurationProperties("bruzfin.rate-limit")
public record RateLimitProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("120") @Positive long authenticatedCapacity,
        @DefaultValue("30") @Positive long anonymousCapacity,
        @DefaultValue("1m") Duration period) {

    RateLimiter.Limit authenticated() {
        return new RateLimiter.Limit(authenticatedCapacity, period);
    }

    RateLimiter.Limit anonymous() {
        return new RateLimiter.Limit(anonymousCapacity, period);
    }
}

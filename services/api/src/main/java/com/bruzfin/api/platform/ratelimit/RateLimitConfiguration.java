package com.bruzfin.api.platform.ratelimit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.data.redis.autoconfigure.DataRedisConnectionDetails;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Liga o rate limit no Valkey, usando a mesma conexão configurada para o Spring Data Redis. */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(RateLimitProperties.class)
@ConditionalOnProperty(prefix = "bruzfin.rate-limit", name = "enabled", havingValue = "true", matchIfMissing = true)
class RateLimitConfiguration {

    @Bean
    ValkeyRateLimiter rateLimiter(DataRedisConnectionDetails connection) {
        DataRedisConnectionDetails.Standalone standalone = connection.getStandalone();
        return new ValkeyRateLimiter(ValkeyRateLimiter.uri(
                standalone.getHost(), standalone.getPort(), connection.getUsername(), connection.getPassword()));
    }

    @Bean
    RateLimitFilter rateLimitFilter(RateLimiter rateLimiter, RateLimitProperties properties) {
        return new RateLimitFilter(rateLimiter, properties);
    }

    /** O filtro roda dentro da cadeia do Spring Security; não deve ser registrado de novo no servlet. */
    @Bean
    FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}

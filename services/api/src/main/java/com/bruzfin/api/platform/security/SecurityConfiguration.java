package com.bruzfin.api.platform.security;

import com.bruzfin.api.platform.ratelimit.RateLimitFilter;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.SupplierJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * API como OAuth2 Resource Server: toda rota exige access token válido do realm {@code bruzfin},
 * exceto o health check (e o contrato OpenAPI fora de produção).
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(BruzfinSecurityProperties.class)
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, BruzfinSecurityProperties properties,
            ObjectProvider<RateLimitFilter> rateLimitFilter) throws Exception {
        ProblemDetailsSecurityHandler problems = new ProblemDetailsSecurityHandler();
        http
                // Só tokens Bearer, sem sessão nem cookie: CSRF não se aplica.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .anonymous(Customizer.withDefaults())
                .cors(Customizer.withDefaults())
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER)))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/actuator/health", "/actuator/health/**", "/error").permitAll();
                    if (properties.publicApiDocs()) {
                        auth.requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll();
                    }
                    auth.anyRequest().access(new VerifiedEmailAuthorizationManager());
                })
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(problems)
                        .accessDeniedHandler(problems))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(problems)
                        .accessDeniedHandler(problems));
        rateLimitFilter.ifAvailable(filter -> http.addFilterAfter(filter, BearerTokenAuthenticationFilter.class));
        return http.build();
    }

    /**
     * Valida assinatura pelas chaves públicas (JWKS) do emissor, com cache, além de validade, emissor e audience.
     * A descoberta do emissor é preguiçosa: a API sobe mesmo com o Keycloak fora do ar.
     */
    @Bean
    JwtDecoder jwtDecoder(BruzfinSecurityProperties properties) {
        return new SupplierJwtDecoder(() -> {
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withIssuerLocation(properties.issuerUri()).build();
            decoder.setJwtValidator(BruzfinJwtValidators.create(properties.issuerUri(), properties.audience()));
            return decoder;
        });
    }

    /** CORS só para as origens configuradas (o web futuro). Sem origens, nenhuma resposta CORS. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(BruzfinSecurityProperties properties) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        if (!properties.corsAllowedOrigins().isEmpty()) {
            CorsConfiguration cors = new CorsConfiguration();
            cors.setAllowedOrigins(properties.corsAllowedOrigins());
            cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
            cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
            cors.setMaxAge(3600L);
            source.registerCorsConfiguration("/api/**", cors);
        }
        return source;
    }
}

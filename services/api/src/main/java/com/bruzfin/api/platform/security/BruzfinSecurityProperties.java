package com.bruzfin.api.platform.security;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Configuração de segurança da API.
 *
 * @param issuerUri          emissor dos tokens (realm do Keycloak); obrigatório
 * @param audience           audience exigida no access token
 * @param publicApiDocs      expõe {@code /v3/api-docs} sem token (só fora de produção)
 * @param corsAllowedOrigins origens web liberadas no CORS; vazio = sem CORS (o app nativo não precisa)
 */
@Validated
@ConfigurationProperties("bruzfin.security")
public record BruzfinSecurityProperties(
        @NotBlank String issuerUri,
        @DefaultValue("bruzfin-api") @NotBlank String audience,
        @DefaultValue("false") boolean publicApiDocs,
        @DefaultValue List<String> corsAllowedOrigins) {
}

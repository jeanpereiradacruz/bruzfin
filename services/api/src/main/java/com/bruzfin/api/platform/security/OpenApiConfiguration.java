package com.bruzfin.api.platform.security;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import java.util.List;
import java.util.Map;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Contrato OpenAPI: todas as operações exigem Bearer e podem responder 401, 403 e 429 em Problem Details.
 * Servidor relativo, para o contrato não mudar por ambiente.
 */
@Configuration(proxyBeanMethods = false)
@OpenAPIDefinition(
        info = @Info(title = "BruzFin API", version = "v1"),
        servers = @Server(url = "/"),
        security = @SecurityRequirement(name = "bearer"))
@SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
class OpenApiConfiguration {

    private static final String PROBLEM = "Problem";

    private static final Map<String, String> STANDARD_ERRORS = Map.of(
            "401", "Token ausente, inválido ou expirado",
            "403", "Email não confirmado ou acesso negado",
            "429", "Muitas requisições; veja o cabeçalho Retry-After");

    @Bean
    OpenApiCustomizer standardErrorResponses() {
        return openApi -> {
            if (openApi.getComponents() == null) {
                openApi.setComponents(new Components());
            }
            openApi.getComponents().addSchemas(PROBLEM, problemSchema());
            if (openApi.getPaths() == null) {
                return;
            }
            openApi.getPaths().values().forEach(path -> path.readOperations().forEach(operation ->
                    STANDARD_ERRORS.forEach((status, description) -> operation.getResponses()
                            .addApiResponse(status, new ApiResponse()
                                    .description(description)
                                    .content(new Content().addMediaType("application/problem+json",
                                            new MediaType().schema(new Schema<>().$ref("#/components/schemas/" + PROBLEM))))))));
        };
    }

    /** RFC 9457. */
    private static Schema<?> problemSchema() {
        ObjectSchema problem = new ObjectSchema();
        problem.setDescription("Erro no formato Problem Details (RFC 9457)");
        problem.setProperties(new java.util.LinkedHashMap<>(Map.of(
                "type", new StringSchema(),
                "title", new StringSchema(),
                "status", new IntegerSchema(),
                "detail", new StringSchema(),
                "instance", new StringSchema())));
        problem.setRequired(List.of("title", "status"));
        return problem;
    }
}

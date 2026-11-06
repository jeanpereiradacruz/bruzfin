package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.domain.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(name = "Me", description = "Perfil do usuário autenticado")
record MeResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
        @Schema(nullable = true) String name,
        // Opcional: só aparece quando o usuário tem lar (a partir do KAN-30).
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "Lar do usuário; ausente enquanto ele não tiver um") Household household) {

    @Schema(name = "MeHousehold")
    record Household(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name) {
    }

    static MeResponse from(User user) {
        return new MeResponse(user.id().value(), user.email(), user.name(), null);
    }
}

package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.HouseholdMembership.Membership;
import com.bruzfin.api.identity.domain.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(name = "Me", description = "Perfil do usuário autenticado")
record MeResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
        @Schema(nullable = true) String name,
        // O lar é criado logo depois do primeiro acesso; só falta se essa criação ainda não terminou.
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "Lar do usuário; ausente enquanto o lar automático não estiver pronto") Household household) {

    @Schema(name = "MeHousehold")
    record Household(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {"OWNER", "MEMBER"},
                    description = "Papel do usuário no lar: quem criou (OWNER) ou quem entrou por convite (MEMBER)")
            String role) {
    }

    static MeResponse from(User user, Membership membership) {
        Household household = membership == null ? null
                : new Household(membership.householdId(), membership.householdName(), membership.role());
        return new MeResponse(user.id().value(), user.email(), user.name(), household);
    }
}

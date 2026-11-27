package com.bruzfin.api.household.adapter.in.web;

import com.bruzfin.api.household.application.port.in.HouseholdView;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Schema(name = "Household", description = "Lar do usuário e os membros dele")
record HouseholdResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {"OWNER", "MEMBER"},
                description = "Papel do usuário autenticado no lar") String role,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "Membros por ordem de entrada")
        List<Member> members) {

    @Schema(name = "HouseholdMember")
    record Member(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
            @Schema(nullable = true) String name,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {"OWNER", "MEMBER"}) String role,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant joinedAt) {
    }

    static HouseholdResponse from(HouseholdView view) {
        return new HouseholdResponse(view.id().value(), view.name(), view.role().name(),
                view.members().stream()
                        .map(m -> new Member(m.userId(), m.email(), m.name(), m.role().name(), m.joinedAt()))
                        .toList());
    }
}

package com.bruzfin.api.household.adapter.in.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

final class HouseholdRequests {

    private HouseholdRequests() {
    }

    @Schema(name = "RenameHouseholdRequest")
    record Rename(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 60) @NotBlank @Size(max = 60)
            String name) {
    }

    @Schema(name = "AcceptHouseholdInviteRequest")
    record Accept(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "ABCD-EFGH", maxLength = 20)
            @NotBlank @Size(max = 20) String code) {

        @Override
        public String toString() {
            return "Accept[code=****]";
        }
    }

    @Schema(name = "HouseholdInvite", description = "Código de convite recém-gerado; não é possível vê-lo de novo")
    record Invite(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "ABCD-EFGH") String code,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant expiresAt) {

        @Override
        public String toString() {
            return "Invite[code=****, expiresAt=" + expiresAt + "]";
        }
    }
}

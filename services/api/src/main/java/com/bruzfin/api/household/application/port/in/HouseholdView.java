package com.bruzfin.api.household.application.port.in;

import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.MemberRole;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** O lar como o usuário o vê: nome, papel dele e membros (por ordem de entrada). */
public record HouseholdView(HouseholdId id, String name, MemberRole role, List<MemberView> members) {

    public HouseholdView {
        members = List.copyOf(members);
    }

    /** @param name nome do perfil; pode faltar */
    public record MemberView(UUID userId, String email, String name, MemberRole role, Instant joinedAt) {
    }
}

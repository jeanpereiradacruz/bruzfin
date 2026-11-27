package com.bruzfin.api.household.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.jmolecules.ddd.annotation.Entity;

/** Vínculo de um usuário (id do módulo de identidade) com um lar. */
@Entity
public record Member(HouseholdId householdId, UUID userId, MemberRole role, Instant joinedAt) {

    public Member {
        Objects.requireNonNull(householdId, "householdId");
        Objects.requireNonNull(userId, "userId");
        Objects.requireNonNull(role, "role");
        Objects.requireNonNull(joinedAt, "joinedAt");
    }
}

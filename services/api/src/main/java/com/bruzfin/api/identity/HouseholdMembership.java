package com.bruzfin.api.identity;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Lar do usuário, fornecido pelo módulo do lar. A identidade só conhece esta interface,
 * então não depende do módulo do lar (que depende dela).
 */
public interface HouseholdMembership {

    Optional<Membership> findFor(UUID userId);

    /** @param role {@code OWNER} ou {@code MEMBER} */
    record Membership(UUID householdId, String householdName, String role) {

        public Membership {
            Objects.requireNonNull(householdId, "householdId");
            Objects.requireNonNull(householdName, "householdName");
            Objects.requireNonNull(role, "role");
        }
    }
}

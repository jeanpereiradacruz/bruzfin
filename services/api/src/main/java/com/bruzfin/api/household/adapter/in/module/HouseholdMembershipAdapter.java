package com.bruzfin.api.household.adapter.in.module;

import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.identity.HouseholdMembership;
import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;

/** Responde ao módulo de identidade qual é o lar do usuário (para o {@code /me} e o escopo de acesso). */
@PrimaryAdapter
public final class HouseholdMembershipAdapter implements HouseholdMembership {

    private final GetHouseholdUseCase households;

    public HouseholdMembershipAdapter(GetHouseholdUseCase households) {
        this.households = households;
    }

    @Override
    public Optional<Membership> findFor(UUID userId) {
        return households.findMembership(userId)
                .map(m -> new Membership(m.householdId().value(), m.householdName(), m.role().name()));
    }
}

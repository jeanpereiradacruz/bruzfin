package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.in.HouseholdView.MemberView;
import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.application.port.out.MemberProfiles;
import com.bruzfin.api.household.application.port.out.MemberProfiles.Profile;
import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdException;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Member;
import com.bruzfin.api.household.domain.MemberRole;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/** Passos comuns aos casos de uso: descobrir o lar do usuário (já no escopo da RLS) e montar a visão do lar. */
final class HouseholdAccess {

    private final HouseholdRepository households;
    private final MemberProfiles profiles;
    private final DataScope scope;

    HouseholdAccess(HouseholdRepository households, MemberProfiles profiles, DataScope scope) {
        this.households = Objects.requireNonNull(households, "households");
        this.profiles = Objects.requireNonNull(profiles, "profiles");
        this.scope = Objects.requireNonNull(scope, "scope");
    }

    /** Vínculo do usuário, já com o lar dele no escopo da transação. */
    Optional<Member> membership(UUID userId) {
        scope.bind(userId, null);
        Optional<Member> member = households.findMembership(userId);
        member.ifPresent(m -> scope.bind(userId, m.householdId()));
        return member;
    }

    Member requireMembership(UUID userId) {
        return membership(userId).orElseThrow(() -> new HouseholdException(HouseholdException.Reason.HOUSEHOLD_NOT_READY));
    }

    Household household(HouseholdId id) {
        return households.findById(id)
                .orElseThrow(() -> new HouseholdException(HouseholdException.Reason.HOUSEHOLD_NOT_READY));
    }

    HouseholdView view(Household household, UUID userId) {
        List<Member> members = households.members(household.id());
        Map<UUID, Profile> byId = profiles.find(members.stream().map(Member::userId).toList());
        MemberRole role = members.stream()
                .filter(m -> m.userId().equals(userId))
                .map(Member::role)
                .findFirst()
                .orElseThrow(() -> new HouseholdException(HouseholdException.Reason.HOUSEHOLD_NOT_READY));
        List<MemberView> views = members.stream()
                .map(m -> {
                    Profile profile = byId.getOrDefault(m.userId(), new Profile("", null));
                    return new MemberView(m.userId(), profile.email(), profile.name(), m.role(), m.joinedAt());
                })
                .toList();
        return new HouseholdView(household.id(), household.name().value(), role, views);
    }

    HouseholdRepository households() {
        return households;
    }

    DataScope scope() {
        return scope;
    }
}

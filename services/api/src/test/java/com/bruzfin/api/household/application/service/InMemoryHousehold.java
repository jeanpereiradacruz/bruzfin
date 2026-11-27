package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.application.port.out.HouseholdData;
import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.application.port.out.InviteAttempts;
import com.bruzfin.api.household.application.port.out.InviteRepository;
import com.bruzfin.api.household.application.port.out.MemberProfiles;
import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Invite;
import com.bruzfin.api.household.domain.Member;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.springframework.transaction.support.TransactionOperations;

/** Portas de saída do lar em memória, para testar os casos de uso sem banco nem Valkey. */
final class InMemoryHousehold implements HouseholdRepository, InviteRepository, DataScope, InviteAttempts,
        MemberProfiles, HouseholdData {

    static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");

    final Map<HouseholdId, Household> households = new LinkedHashMap<>();
    final Map<UUID, Member> members = new LinkedHashMap<>();
    final Map<String, Invite> invites = new LinkedHashMap<>();
    final Map<UUID, Integer> failures = new HashMap<>();
    final Set<HouseholdId> withData = new HashSet<>();
    final List<String> scopes = new ArrayList<>();
    final int maxFailures = 3;
    final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);

    HouseholdUseCases useCases() {
        return useCasesAt(clock);
    }

    HouseholdUseCases useCasesAt(Clock at) {
        return new HouseholdUseCases(this, this, this, this, this, this, new Random(42),
                TransactionOperations.withoutTransaction(), at);
    }

    CreateHouseholdService create() {
        return new CreateHouseholdService(this, this, TransactionOperations.withoutTransaction(), clock);
    }

    // HouseholdRepository

    @Override
    public void insert(Household household) {
        households.put(household.id(), household);
    }

    @Override
    public Optional<Household> findById(HouseholdId id) {
        return Optional.ofNullable(households.get(id));
    }

    @Override
    public void rename(Household household) {
        households.put(household.id(), household);
    }

    @Override
    public void delete(HouseholdId id) {
        households.remove(id);
        members.values().removeIf(m -> m.householdId().equals(id));
        invites.values().removeIf(i -> i.householdId().equals(id));
    }

    @Override
    public void insertMember(Member member) {
        if (members.putIfAbsent(member.userId(), member) != null) {
            throw new IllegalStateException("usuário já pertence a um lar");
        }
    }

    @Override
    public Optional<Member> findMembership(UUID userId) {
        return Optional.ofNullable(members.get(userId));
    }

    @Override
    public List<Member> members(HouseholdId id) {
        return members.values().stream()
                .filter(m -> m.householdId().equals(id))
                .sorted(Comparator.comparing(Member::joinedAt))
                .toList();
    }

    // InviteRepository

    @Override
    public void insert(Invite invite) {
        invites.put(invite.codeHash(), invite);
    }

    @Override
    public void deletePending(HouseholdId householdId) {
        invites.values().removeIf(i -> i.householdId().equals(householdId) && !i.isUsed());
    }

    @Override
    public Optional<Invite> findByCodeHashForUpdate(String codeHash) {
        return Optional.ofNullable(invites.get(codeHash));
    }

    @Override
    public void markUsed(Invite invite) {
        invites.put(invite.codeHash(), invite);
    }

    // DataScope

    @Override
    public void bind(UUID userId, HouseholdId householdId) {
        scopes.add(userId + "@" + (householdId == null ? "-" : householdId.value()));
    }

    @Override
    public void allowInvite(String codeHash) {
        scopes.add("invite:" + codeHash);
    }

    // InviteAttempts

    @Override
    public Optional<Duration> blockedFor(UUID userId) {
        return failures.getOrDefault(userId, 0) >= maxFailures ? Optional.of(Duration.ofMinutes(15)) : Optional.empty();
    }

    @Override
    public void recordFailure(UUID userId) {
        failures.merge(userId, 1, Integer::sum);
    }

    @Override
    public void clear(UUID userId) {
        failures.remove(userId);
    }

    // MemberProfiles

    @Override
    public Map<UUID, Profile> find(Collection<UUID> userIds) {
        Map<UUID, Profile> profiles = new HashMap<>();
        userIds.forEach(id -> profiles.put(id, new Profile(id + "@bruzfin.local", "Pessoa " + id)));
        return profiles;
    }

    // HouseholdData

    @Override
    public boolean hasData(HouseholdId householdId) {
        return withData.contains(householdId);
    }
}

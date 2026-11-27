package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.CreateHouseholdUseCase;
import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdName;
import com.bruzfin.api.household.domain.Member;
import com.bruzfin.api.household.domain.MemberRole;
import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.transaction.support.TransactionOperations;

public final class CreateHouseholdService implements CreateHouseholdUseCase {

    private final HouseholdRepository households;
    private final DataScope scope;
    private final TransactionOperations transactions;
    private final Clock clock;

    public CreateHouseholdService(HouseholdRepository households, DataScope scope,
            TransactionOperations transactions, Clock clock) {
        this.households = Objects.requireNonNull(households, "households");
        this.scope = Objects.requireNonNull(scope, "scope");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public void createFor(UUID userId, String displayName) {
        transactions.executeWithoutResult(status -> {
            scope.bind(userId, null);
            if (households.findMembership(userId).isPresent()) {
                return;
            }
            Instant now = clock.instant();
            Household household = Household.create(HouseholdName.defaultFor(displayName), now);
            scope.bind(userId, household.id());
            households.insert(household);
            households.insertMember(new Member(household.id(), userId, MemberRole.OWNER, now));
        });
    }
}

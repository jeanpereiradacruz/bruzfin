package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.in.RenameHouseholdUseCase;
import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdName;
import java.time.Clock;
import java.util.Objects;
import java.util.UUID;
import org.springframework.transaction.support.TransactionOperations;

public final class RenameHouseholdService implements RenameHouseholdUseCase {

    private final HouseholdAccess access;
    private final TransactionOperations transactions;
    private final Clock clock;

    RenameHouseholdService(HouseholdAccess access, TransactionOperations transactions, Clock clock) {
        this.access = Objects.requireNonNull(access, "access");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public HouseholdView rename(UUID userId, String name) {
        HouseholdName newName = new HouseholdName(name == null ? "" : name);
        return transactions.execute(status -> {
            Household current = access.household(access.requireMembership(userId).householdId());
            Household renamed = current.renamed(newName, clock.instant());
            if (renamed != current) {
                access.households().rename(renamed);
            }
            return access.view(renamed, userId);
        });
    }
}

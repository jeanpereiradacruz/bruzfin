package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.in.MembershipView;
import com.bruzfin.api.household.domain.Member;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.transaction.support.TransactionOperations;

public final class GetHouseholdService implements GetHouseholdUseCase {

    private final HouseholdAccess access;
    private final TransactionOperations transactions;

    GetHouseholdService(HouseholdAccess access, TransactionOperations transactions) {
        this.access = Objects.requireNonNull(access, "access");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
    }

    @Override
    public HouseholdView get(UUID userId) {
        return transactions.execute(status -> {
            Member member = access.requireMembership(userId);
            return access.view(access.household(member.householdId()), userId);
        });
    }

    @Override
    public Optional<MembershipView> findMembership(UUID userId) {
        return transactions.execute(status -> access.membership(userId)
                .flatMap(member -> access.households().findById(member.householdId())
                        .map(household -> new MembershipView(household.id(), household.name().value(), member.role()))));
    }
}

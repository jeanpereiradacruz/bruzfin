package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.InviteMemberUseCase;
import com.bruzfin.api.household.application.port.in.IssuedInvite;
import com.bruzfin.api.household.application.port.out.InviteRepository;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Invite;
import com.bruzfin.api.household.domain.InviteCode;
import java.time.Clock;
import java.util.Objects;
import java.util.UUID;
import java.util.random.RandomGenerator;
import org.springframework.transaction.support.TransactionOperations;

public final class InviteMemberService implements InviteMemberUseCase {

    private final HouseholdAccess access;
    private final InviteRepository invites;
    private final RandomGenerator random;
    private final TransactionOperations transactions;
    private final Clock clock;

    InviteMemberService(HouseholdAccess access, InviteRepository invites, RandomGenerator random,
            TransactionOperations transactions, Clock clock) {
        this.access = Objects.requireNonNull(access, "access");
        this.invites = Objects.requireNonNull(invites, "invites");
        this.random = Objects.requireNonNull(random, "random");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public IssuedInvite invite(UUID userId) {
        return transactions.execute(status -> {
            HouseholdId householdId = access.requireMembership(userId).householdId();
            invites.deletePending(householdId);
            InviteCode code = InviteCode.generate(random);
            Invite invite = Invite.issue(householdId, code, userId, clock.instant());
            invites.insert(invite);
            return new IssuedInvite(code.formatted(), invite.expiresAt());
        });
    }
}

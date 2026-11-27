package com.bruzfin.api.identity.application.service;

import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.application.port.out.UserEvents;
import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.domain.IdentityClaims;
import com.bruzfin.api.identity.domain.User;
import java.time.Clock;
import java.util.Objects;
import java.util.Optional;
import org.springframework.transaction.support.TransactionOperations;

public final class GetCurrentUserService implements GetCurrentUserUseCase {

    private final UserRepository users;
    private final UserEvents events;
    private final TransactionOperations transactions;
    private final Clock clock;

    public GetCurrentUserService(UserRepository users, UserEvents events, TransactionOperations transactions,
            Clock clock) {
        this.users = Objects.requireNonNull(users, "users");
        this.events = Objects.requireNonNull(events, "events");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public User getCurrentUser(IdentityClaims claims) {
        User user = users.findBySubject(claims.subject()).orElseGet(() -> provision(claims));
        if (user.isInSyncWith(claims)) {
            return user;
        }
        User synced = user.syncedWith(claims, clock.instant());
        users.updateProfile(synced);
        return synced;
    }

    /** Usuário e evento na mesma transação: o lar automático nunca deixa de ser criado. */
    private User provision(IdentityClaims claims) {
        User candidate = User.provision(claims, clock.instant());
        return Optional.ofNullable(transactions.execute(status -> {
            User stored = users.insertIfAbsent(candidate);
            if (stored.id().equals(candidate.id())) {
                events.provisioned(stored);
            }
            return stored;
        })).orElseThrow();
    }
}

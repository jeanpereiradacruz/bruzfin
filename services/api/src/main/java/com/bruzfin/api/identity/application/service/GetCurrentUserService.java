package com.bruzfin.api.identity.application.service;

import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.domain.IdentityClaims;
import com.bruzfin.api.identity.domain.User;
import java.time.Clock;
import java.util.Objects;

public final class GetCurrentUserService implements GetCurrentUserUseCase {

    private final UserRepository users;
    private final Clock clock;

    public GetCurrentUserService(UserRepository users, Clock clock) {
        this.users = Objects.requireNonNull(users, "users");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public User getCurrentUser(IdentityClaims claims) {
        User user = users.findBySubject(claims.subject())
                .orElseGet(() -> users.insertIfAbsent(User.provision(claims, clock.instant())));
        if (user.isInSyncWith(claims)) {
            return user;
        }
        User synced = user.syncedWith(claims, clock.instant());
        users.updateProfile(synced);
        return synced;
    }
}

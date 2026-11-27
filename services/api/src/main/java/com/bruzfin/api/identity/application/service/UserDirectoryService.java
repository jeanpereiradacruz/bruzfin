package com.bruzfin.api.identity.application.service;

import com.bruzfin.api.identity.UserDirectory;
import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.domain.UserId;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** Implementa a consulta de perfis exposta aos outros módulos. */
public final class UserDirectoryService implements UserDirectory {

    private final UserRepository users;

    public UserDirectoryService(UserRepository users) {
        this.users = Objects.requireNonNull(users, "users");
    }

    @Override
    public List<UserProfile> findByIds(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return users.findByIds(ids.stream().map(UserId::new).toList()).stream()
                .map(user -> new UserProfile(user.id().value(), user.email(), user.name()))
                .toList();
    }
}

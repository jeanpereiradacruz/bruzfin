package com.bruzfin.api.shared.tenancy;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Quem está agindo na requisição: o usuário e o lar dele (ausente enquanto o lar não existir).
 * É o que a Row-Level Security do PostgreSQL usa para filtrar as linhas de cada lar.
 */
public record AccessScope(UUID userId, UUID householdId) {

    public AccessScope {
        Objects.requireNonNull(userId, "userId");
    }

    public Optional<UUID> household() {
        return Optional.ofNullable(householdId);
    }
}

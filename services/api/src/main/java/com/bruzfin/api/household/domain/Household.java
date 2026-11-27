package com.bruzfin.api.household.domain;

import java.time.Instant;
import java.util.Objects;
import org.jmolecules.ddd.annotation.AggregateRoot;
import org.jmolecules.ddd.annotation.Identity;

@AggregateRoot
public record Household(@Identity HouseholdId id, HouseholdName name, Instant createdAt, Instant updatedAt) {

    public Household {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(name, "name");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(updatedAt, "updatedAt");
    }

    public static Household create(HouseholdName name, Instant now) {
        return new Household(HouseholdId.newId(), name, now, now);
    }

    public Household renamed(HouseholdName newName, Instant now) {
        return newName.equals(name) ? this : new Household(id, newName, createdAt, now);
    }
}

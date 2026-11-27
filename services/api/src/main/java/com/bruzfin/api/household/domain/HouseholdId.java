package com.bruzfin.api.household.domain;

import com.bruzfin.api.shared.domain.UuidV7;
import java.util.Objects;
import java.util.UUID;
import org.jmolecules.ddd.annotation.ValueObject;

@ValueObject
public record HouseholdId(UUID value) {

    public HouseholdId {
        Objects.requireNonNull(value, "value");
    }

    public static HouseholdId newId() {
        return new HouseholdId(UuidV7.next());
    }
}

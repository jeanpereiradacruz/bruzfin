package com.bruzfin.api.household.domain;

import java.util.Objects;
import org.jmolecules.ddd.annotation.ValueObject;

/** Nome do lar: de 1 a 60 caracteres, sem espaços sobrando. */
@ValueObject
public record HouseholdName(String value) {

    public static final int MAX_LENGTH = 60;
    private static final String PREFIX = "Lar de ";

    public HouseholdName {
        Objects.requireNonNull(value, "value");
        value = value.strip().replaceAll("\\s+", " ");
        if (value.isEmpty() || value.length() > MAX_LENGTH) {
            throw new InvalidHouseholdNameException();
        }
    }

    /** Nome do lar automático: "Lar de" + o primeiro nome. */
    public static HouseholdName defaultFor(String displayName) {
        String first = displayName == null ? "" : displayName.strip().split("\\s+", 2)[0];
        if (first.isEmpty()) {
            return new HouseholdName("Meu lar");
        }
        int room = MAX_LENGTH - PREFIX.length();
        return new HouseholdName(PREFIX + (first.length() > room ? first.substring(0, room) : first));
    }
}

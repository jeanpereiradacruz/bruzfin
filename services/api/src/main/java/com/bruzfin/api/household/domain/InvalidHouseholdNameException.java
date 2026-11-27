package com.bruzfin.api.household.domain;

/** Nome do lar vazio ou longo demais. */
public final class InvalidHouseholdNameException extends HouseholdException {

    private static final long serialVersionUID = 1L;

    public InvalidHouseholdNameException() {
        super(Reason.INVALID_NAME);
    }
}

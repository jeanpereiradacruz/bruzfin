package com.bruzfin.api.household.application.port.in;

import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.MemberRole;

public record MembershipView(HouseholdId householdId, String householdName, MemberRole role) {
}

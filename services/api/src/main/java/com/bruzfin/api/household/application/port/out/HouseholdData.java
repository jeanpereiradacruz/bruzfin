package com.bruzfin.api.household.application.port.out;

import com.bruzfin.api.household.domain.HouseholdId;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/** O lar tem dados próprios em outros módulos (contas, lançamentos...)? */
@SecondaryPort
public interface HouseholdData {

    boolean hasData(HouseholdId householdId);
}

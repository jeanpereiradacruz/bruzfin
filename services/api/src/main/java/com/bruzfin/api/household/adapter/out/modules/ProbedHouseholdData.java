package com.bruzfin.api.household.adapter.out.modules;

import com.bruzfin.api.household.HouseholdDataProbe;
import com.bruzfin.api.household.application.port.out.HouseholdData;
import com.bruzfin.api.household.domain.HouseholdId;
import java.util.List;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;

/** Pergunta a cada módulo com dados do lar (contas, lançamentos...) se o lar tem algo dele. */
@SecondaryAdapter
public final class ProbedHouseholdData implements HouseholdData {

    private final List<HouseholdDataProbe> probes;

    public ProbedHouseholdData(List<HouseholdDataProbe> probes) {
        this.probes = List.copyOf(probes);
    }

    @Override
    public boolean hasData(HouseholdId householdId) {
        return probes.stream().anyMatch(probe -> probe.hasData(householdId.value()));
    }
}

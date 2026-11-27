package com.bruzfin.api.household.application.port.out;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/** Email e nome dos membros (vêm do módulo de identidade). */
@SecondaryPort
public interface MemberProfiles {

    Map<UUID, Profile> find(Collection<UUID> userIds);

    record Profile(String email, String name) {
    }
}

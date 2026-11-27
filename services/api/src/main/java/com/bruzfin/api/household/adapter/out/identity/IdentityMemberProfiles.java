package com.bruzfin.api.household.adapter.out.identity;

import com.bruzfin.api.household.application.port.out.MemberProfiles;
import com.bruzfin.api.identity.UserDirectory;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;

/** Busca email e nome dos membros pela API pública do módulo de identidade. */
@SecondaryAdapter
public final class IdentityMemberProfiles implements MemberProfiles {

    private final UserDirectory users;

    public IdentityMemberProfiles(UserDirectory users) {
        this.users = users;
    }

    @Override
    public Map<UUID, Profile> find(Collection<UUID> userIds) {
        return users.findByIds(userIds).stream()
                .collect(Collectors.toMap(UserDirectory.UserProfile::id, u -> new Profile(u.email(), u.name())));
    }
}

package com.bruzfin.api.identity;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** Consulta de perfis de usuários para outros módulos (ex.: membros do lar). */
public interface UserDirectory {

    List<UserProfile> findByIds(Collection<UUID> ids);

    record UserProfile(UUID id, String email, String name) {
    }
}

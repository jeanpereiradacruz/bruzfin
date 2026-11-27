package com.bruzfin.api.household.application.port.in;

import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: ver o lar do usuário e os membros. */
@PrimaryPort
public interface GetHouseholdUseCase {

    HouseholdView get(UUID userId);

    /** Só o vínculo (lar e papel), sem membros; vazio enquanto o lar automático não estiver pronto. */
    Optional<MembershipView> findMembership(UUID userId);
}

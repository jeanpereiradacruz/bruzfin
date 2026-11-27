package com.bruzfin.api.household.application.port.in;

import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: criar o lar automático de um usuário novo. Idempotente (o evento pode chegar de novo). */
@PrimaryPort
public interface CreateHouseholdUseCase {

    void createFor(UUID userId, String displayName);
}

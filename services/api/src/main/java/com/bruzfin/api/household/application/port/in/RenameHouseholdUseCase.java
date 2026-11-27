package com.bruzfin.api.household.application.port.in;

import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: trocar o nome do lar (qualquer membro pode). */
@PrimaryPort
public interface RenameHouseholdUseCase {

    HouseholdView rename(UUID userId, String name);
}

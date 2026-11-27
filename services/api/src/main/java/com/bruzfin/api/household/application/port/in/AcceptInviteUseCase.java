package com.bruzfin.api.household.application.port.in;

import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/**
 * Caso de uso: entrar num lar com o código de convite. O lar automático do convidado é descartado
 * se estiver vazio; com outros membros ou dados próprios, o aceite é recusado.
 */
@PrimaryPort
public interface AcceptInviteUseCase {

    HouseholdView accept(UUID userId, String code);
}

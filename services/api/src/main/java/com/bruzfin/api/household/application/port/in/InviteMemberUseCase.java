package com.bruzfin.api.household.application.port.in;

import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: gerar um código de convite (48 horas, uso único). O código anterior ainda não usado deixa de valer. */
@PrimaryPort
public interface InviteMemberUseCase {

    IssuedInvite invite(UUID userId);
}

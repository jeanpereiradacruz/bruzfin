package com.bruzfin.api.household.application.port.out;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/**
 * Tentativas erradas de código de convite por usuário. Depois do limite, o usuário fica bloqueado por um tempo.
 * Se o contador estiver indisponível, lança {@code HouseholdException(ATTEMPTS_UNAVAILABLE)}: sem contador, sem aceite.
 */
@SecondaryPort
public interface InviteAttempts {

    /** Quanto falta para o bloqueio acabar; vazio se o usuário pode tentar. */
    Optional<Duration> blockedFor(UUID userId);

    void recordFailure(UUID userId);

    void clear(UUID userId);
}

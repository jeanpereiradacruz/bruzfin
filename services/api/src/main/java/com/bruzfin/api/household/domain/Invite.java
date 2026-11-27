package com.bruzfin.api.household.domain;

import com.bruzfin.api.shared.domain.UuidV7;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.jmolecules.ddd.annotation.Entity;

/** Convite de uso único para entrar num lar, válido por 48 horas. */
@Entity
public record Invite(
        UUID id,
        HouseholdId householdId,
        String codeHash,
        UUID createdBy,
        Instant createdAt,
        Instant expiresAt,
        UUID usedBy,
        Instant usedAt) {

    public static final Duration VALIDITY = Duration.ofHours(48);

    public Invite {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(householdId, "householdId");
        Objects.requireNonNull(codeHash, "codeHash");
        Objects.requireNonNull(createdBy, "createdBy");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(expiresAt, "expiresAt");
        if ((usedBy == null) != (usedAt == null)) {
            throw new IllegalArgumentException("Convite usado precisa de quem usou e quando");
        }
    }

    public static Invite issue(HouseholdId householdId, InviteCode code, UUID createdBy, Instant now) {
        return new Invite(UuidV7.next(), householdId, code.hash(), createdBy, now, now.plus(VALIDITY), null, null);
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isExpiredAt(Instant now) {
        return !now.isBefore(expiresAt);
    }

    /** Confere se ainda vale e marca como usado. */
    public Invite redeem(UUID userId, Instant now) {
        Objects.requireNonNull(userId, "userId");
        if (isUsed()) {
            throw new HouseholdException(HouseholdException.Reason.INVITE_ALREADY_USED);
        }
        if (isExpiredAt(now)) {
            throw new HouseholdException(HouseholdException.Reason.INVITE_EXPIRED);
        }
        return new Invite(id, householdId, codeHash, createdBy, createdAt, expiresAt, userId, now);
    }
}

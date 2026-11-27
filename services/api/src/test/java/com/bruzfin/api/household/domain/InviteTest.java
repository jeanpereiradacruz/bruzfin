package com.bruzfin.api.household.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Convite")
class InviteTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");
    private static final UUID INVITER = UUID.randomUUID();
    private static final UUID GUEST = UUID.randomUUID();

    private final Invite invite = Invite.issue(HouseholdId.newId(),
            InviteCode.parse("ABCD-1230").orElseThrow(), INVITER, NOW);

    @Test
    @DisplayName("vale por 48 horas")
    void validFor48Hours() {
        assertThat(invite.expiresAt()).isEqualTo(NOW.plus(Duration.ofHours(48)));
        assertThat(invite.isExpiredAt(NOW.plus(Duration.ofHours(48)).minusSeconds(1))).isFalse();
        assertThat(invite.isExpiredAt(NOW.plus(Duration.ofHours(48)))).isTrue();
    }

    @Test
    @DisplayName("ao ser usado, registra quem usou e quando")
    void redeem() {
        Invite used = invite.redeem(GUEST, NOW.plusSeconds(60));

        assertThat(used.isUsed()).isTrue();
        assertThat(used.usedBy()).isEqualTo(GUEST);
        assertThat(used.usedAt()).isEqualTo(NOW.plusSeconds(60));
    }

    @Test
    @DisplayName("convite vencido não pode ser usado")
    void expired() {
        assertThatThrownBy(() -> invite.redeem(GUEST, NOW.plus(Duration.ofHours(49))))
                .isInstanceOfSatisfying(HouseholdException.class,
                        e -> assertThat(e.reason()).isEqualTo(HouseholdException.Reason.INVITE_EXPIRED));
    }

    @Test
    @DisplayName("convite já usado não pode ser usado de novo")
    void alreadyUsed() {
        Invite used = invite.redeem(GUEST, NOW.plusSeconds(60));

        assertThatThrownBy(() -> used.redeem(UUID.randomUUID(), NOW.plusSeconds(120)))
                .isInstanceOfSatisfying(HouseholdException.class,
                        e -> assertThat(e.reason()).isEqualTo(HouseholdException.Reason.INVITE_ALREADY_USED));
    }
}

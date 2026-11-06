package com.bruzfin.api.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("UUIDv7")
class UuidV7Test {

    @Test
    @DisplayName("tem versão 7 e variante RFC 9562")
    void versionAndVariant() {
        UUID id = UuidV7.next();

        assertThat(id.version()).isEqualTo(7);
        assertThat(id.variant()).isEqualTo(2);
    }

    @Test
    @DisplayName("guarda o instante em milissegundos nos primeiros 48 bits")
    void embedsTimestamp() {
        Instant instant = Instant.parse("2026-11-05T12:00:00.123Z");
        UUID id = UuidV7.next(Clock.fixed(instant, ZoneOffset.UTC));

        assertThat(id.getMostSignificantBits() >>> 16).isEqualTo(instant.toEpochMilli());
    }

    @Test
    @DisplayName("é ordenável pelo tempo de criação")
    void sortsByTime() {
        UUID earlier = UuidV7.next(Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
        UUID later = UuidV7.next(Clock.fixed(Instant.parse("2026-01-01T00:00:01Z"), ZoneOffset.UTC));

        assertThat(earlier.toString()).isLessThan(later.toString());
    }

    @Test
    @DisplayName("não repete")
    void unique() {
        Set<UUID> ids = new HashSet<>();
        for (int i = 0; i < 10_000; i++) {
            ids.add(UuidV7.next());
        }
        assertThat(ids).hasSize(10_000);
    }
}

package com.bruzfin.api.shared.domain;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.UUID;

/**
 * Gera UUIDs versão 7 (RFC 9562): 48 bits de timestamp em milissegundos + 74 bits aleatórios.
 * Ordenáveis por tempo, o que mantém os índices do PostgreSQL compactos.
 */
public final class UuidV7 {

    private static final SecureRandom RANDOM = new SecureRandom();

    private UuidV7() {
    }

    public static UUID next() {
        return next(Clock.systemUTC());
    }

    static UUID next(Clock clock) {
        long millis = clock.millis() & 0xFFFF_FFFF_FFFFL;
        long randA = RANDOM.nextInt(1 << 12);
        long randB = RANDOM.nextLong() & 0x3FFF_FFFF_FFFF_FFFFL;
        long mostSignificant = (millis << 16) | (0x7L << 12) | randA;
        long leastSignificant = (0x2L << 62) | randB;
        return new UUID(mostSignificant, leastSignificant);
    }
}

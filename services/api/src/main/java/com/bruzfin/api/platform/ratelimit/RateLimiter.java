package com.bruzfin.api.platform.ratelimit;

import java.time.Duration;

/** Limite de requisições por chave (usuário ou IP). */
public interface RateLimiter {

    Decision tryConsume(String key, Limit limit);

    /** {@code capacity} requisições a cada {@code period}, reabastecidas continuamente. */
    record Limit(long capacity, Duration period) {
    }

    record Decision(boolean allowed, Duration retryAfter) {

        public static Decision allow() {
            return new Decision(true, Duration.ZERO);
        }

        public static Decision reject(Duration retryAfter) {
            return new Decision(false, retryAfter);
        }
    }
}

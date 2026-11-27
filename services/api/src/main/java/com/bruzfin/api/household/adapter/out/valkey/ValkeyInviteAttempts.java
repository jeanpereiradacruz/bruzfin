package com.bruzfin.api.household.adapter.out.valkey;

import com.bruzfin.api.household.application.port.out.InviteAttempts;
import com.bruzfin.api.household.domain.HouseholdException;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Conta as tentativas erradas no Valkey, numa janela que começa na primeira falha.
 * Sem Valkey, o aceite falha (fail-closed): não dá para liberar tentativas sem limite.
 */
@SecondaryAdapter
public final class ValkeyInviteAttempts implements InviteAttempts {

    private static final Logger log = LoggerFactory.getLogger(ValkeyInviteAttempts.class);

    private final StringRedisTemplate redis;
    private final int maxFailures;
    private final Duration window;

    public ValkeyInviteAttempts(StringRedisTemplate redis, int maxFailures, Duration window) {
        this.redis = redis;
        this.maxFailures = maxFailures;
        this.window = window;
    }

    @Override
    public Optional<Duration> blockedFor(UUID userId) {
        return guarded(() -> {
            String key = key(userId);
            String failures = redis.opsForValue().get(key);
            if (failures == null || Long.parseLong(failures) < maxFailures) {
                return Optional.empty();
            }
            Long seconds = redis.getExpire(key, TimeUnit.SECONDS);
            if (seconds == null || seconds < 0) {
                redis.expire(key, window);
                return Optional.of(window);
            }
            return Optional.of(Duration.ofSeconds(Math.max(1, seconds)));
        });
    }

    @Override
    public void recordFailure(UUID userId) {
        guarded(() -> {
            String key = key(userId);
            Long failures = redis.opsForValue().increment(key);
            if (failures != null && failures == 1) {
                redis.expire(key, window);
            }
            return null;
        });
    }

    @Override
    public void clear(UUID userId) {
        guarded(() -> redis.delete(key(userId)));
    }

    private static String key(UUID userId) {
        return "household:invite-failures:" + userId;
    }

    private static <T> T guarded(Supplier<T> action) {
        try {
            return action.get();
        } catch (RuntimeException e) {
            log.warn("Contador de tentativas de convite indisponível: {}", e.getClass().getSimpleName());
            throw new HouseholdException(HouseholdException.Reason.ATTEMPTS_UNAVAILABLE);
        }
    }
}

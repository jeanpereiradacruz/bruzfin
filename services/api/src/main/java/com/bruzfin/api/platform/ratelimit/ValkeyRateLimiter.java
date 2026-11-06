package com.bruzfin.api.platform.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import java.time.Duration;
import org.springframework.beans.factory.DisposableBean;

/**
 * Rate limit distribuído com Bucket4j (token bucket) guardado no Valkey.
 * A conexão é aberta no primeiro uso, para a API subir mesmo com o Valkey fora do ar.
 */
final class ValkeyRateLimiter implements RateLimiter, DisposableBean {

    private static final Duration TIMEOUT = Duration.ofSeconds(2);

    private final RedisClient client;
    private volatile StatefulRedisConnection<String, byte[]> connection;
    private volatile ProxyManager<String> buckets;

    ValkeyRateLimiter(RedisURI uri) {
        this.client = RedisClient.create(uri);
    }

    static RedisURI uri(String host, int port, String username, String password) {
        RedisURI.Builder builder = RedisURI.builder().withHost(host).withPort(port).withTimeout(TIMEOUT);
        if (password != null && !password.isEmpty()) {
            if (username != null && !username.isEmpty()) {
                builder.withAuthentication(username, password.toCharArray());
            } else {
                builder.withPassword(password.toCharArray());
            }
        }
        return builder.build();
    }

    @Override
    public Decision tryConsume(String key, Limit limit) {
        ConsumptionProbe probe = buckets().builder()
                .build(key, () -> configuration(limit))
                .tryConsumeAndReturnRemaining(1);
        return probe.isConsumed()
                ? Decision.allow()
                : Decision.reject(Duration.ofNanos(probe.getNanosToWaitForRefill()));
    }

    private static BucketConfiguration configuration(Limit limit) {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit.capacity())
                        .refillGreedy(limit.capacity(), limit.period())
                        .build())
                .build();
    }

    private ProxyManager<String> buckets() {
        ProxyManager<String> current = buckets;
        if (current == null) {
            synchronized (this) {
                if (buckets == null) {
                    connection = client.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
                    buckets = Bucket4jLettuce.casBasedBuilder(connection)
                            // Bucket cheio some do Valkey: não acumula chaves de quem parou de usar.
                            .expirationAfterWrite(ExpirationAfterWriteStrategy
                                    .basedOnTimeForRefillingBucketUpToMax(Duration.ofSeconds(10)))
                            .build();
                }
                current = buckets;
            }
        }
        return current;
    }

    @Override
    public void destroy() {
        StatefulRedisConnection<String, byte[]> current = connection;
        if (current != null) {
            current.close();
        }
        client.shutdown(Duration.ZERO, TIMEOUT);
    }
}

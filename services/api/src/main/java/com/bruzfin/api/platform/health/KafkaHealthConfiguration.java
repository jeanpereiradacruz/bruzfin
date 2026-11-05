package com.bruzfin.api.platform.health;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaAdmin;

/** Registra o health check do Kafka usando a mesma configuração do {@link KafkaAdmin} do Spring Boot. */
@Configuration(proxyBeanMethods = false)
class KafkaHealthConfiguration {

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    @Bean
    KafkaHealthIndicator kafkaHealthIndicator(KafkaAdmin kafkaAdmin) {
        Map<String, Object> config = new HashMap<>(kafkaAdmin.getConfigurationProperties());
        config.put(AdminClientConfig.CLIENT_ID_CONFIG, "bruzfin-api-health");
        config.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, (int) TIMEOUT.toMillis());
        config.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, (int) TIMEOUT.toMillis());
        // O cliente pertence ao indicador, que o fecha no desligamento (DisposableBean).
        return new KafkaHealthIndicator(Admin.create(config), TIMEOUT);
    }
}

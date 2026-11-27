package com.bruzfin.api.platform.persistence;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.transaction.autoconfigure.TransactionManagerCustomizers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/** Substitui o gerenciador de transações do Spring Boot pelo que aplica a Row-Level Security. */
@Configuration(proxyBeanMethods = false)
class PersistenceConfiguration {

    @Bean
    PlatformTransactionManager transactionManager(EntityManagerFactory emf,
            ObjectProvider<TransactionManagerCustomizers> customizers) {
        RowLevelSecurityTransactionManager manager = new RowLevelSecurityTransactionManager(emf);
        customizers.ifAvailable(c -> c.customize(manager));
        return manager;
    }
}

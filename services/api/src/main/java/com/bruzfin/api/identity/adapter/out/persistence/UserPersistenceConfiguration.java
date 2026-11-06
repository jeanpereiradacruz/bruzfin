package com.bruzfin.api.identity.adapter.out.persistence;

import com.bruzfin.api.identity.application.port.out.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Publica só a porta {@link UserRepository}; o repositório Spring Data fica interno ao pacote. */
@Configuration(proxyBeanMethods = false)
class UserPersistenceConfiguration {

    @Bean
    UserRepository userRepository(UserJpaRepository jpa) {
        return new UserPersistenceAdapter(jpa);
    }
}

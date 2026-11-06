package com.bruzfin.api.identity.adapter.config;

import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.application.service.GetCurrentUserService;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Liga o caso de uso às suas portas de saída. */
@Configuration(proxyBeanMethods = false)
class IdentityModuleConfiguration {

    @Bean
    GetCurrentUserUseCase getCurrentUserUseCase(UserRepository users) {
        return new GetCurrentUserService(users, Clock.systemUTC());
    }
}

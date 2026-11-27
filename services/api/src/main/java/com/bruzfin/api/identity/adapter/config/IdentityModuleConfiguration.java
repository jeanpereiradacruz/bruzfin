package com.bruzfin.api.identity.adapter.config;

import com.bruzfin.api.identity.UserDirectory;
import com.bruzfin.api.identity.adapter.out.events.SpringUserEvents;
import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.application.port.out.UserEvents;
import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.application.service.GetCurrentUserService;
import com.bruzfin.api.identity.application.service.UserDirectoryService;
import java.time.Clock;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Liga os casos de uso às suas portas de saída. */
@Configuration(proxyBeanMethods = false)
class IdentityModuleConfiguration {

    @Bean
    UserEvents userEvents(ApplicationEventPublisher publisher) {
        return new SpringUserEvents(publisher);
    }

    @Bean
    GetCurrentUserUseCase getCurrentUserUseCase(UserRepository users, UserEvents events,
            PlatformTransactionManager transactionManager) {
        return new GetCurrentUserService(users, events, new TransactionTemplate(transactionManager), Clock.systemUTC());
    }

    @Bean
    UserDirectory userDirectory(UserRepository users) {
        return new UserDirectoryService(users);
    }
}

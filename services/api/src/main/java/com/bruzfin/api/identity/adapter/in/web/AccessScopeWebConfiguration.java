package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.HouseholdMembership;
import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.handler.MappedInterceptor;

/** Registra o interceptor do escopo de acesso para todas as rotas da API. */
@Configuration(proxyBeanMethods = false)
class AccessScopeWebConfiguration {

    @Bean
    MappedInterceptor accessScopeInterceptor(GetCurrentUserUseCase getCurrentUser, HouseholdMembership households) {
        return new MappedInterceptor(new String[] {"/api/**"}, new AccessScopeInterceptor(getCurrentUser, households));
    }
}

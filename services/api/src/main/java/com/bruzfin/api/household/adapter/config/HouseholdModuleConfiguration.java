package com.bruzfin.api.household.adapter.config;

import com.bruzfin.api.household.HouseholdDataProbe;
import com.bruzfin.api.household.adapter.in.event.UserProvisionedListener;
import com.bruzfin.api.household.adapter.in.module.HouseholdMembershipAdapter;
import com.bruzfin.api.household.adapter.out.identity.IdentityMemberProfiles;
import com.bruzfin.api.household.adapter.out.modules.ProbedHouseholdData;
import com.bruzfin.api.household.adapter.out.persistence.JdbcDataScope;
import com.bruzfin.api.household.adapter.out.persistence.JdbcHouseholdRepository;
import com.bruzfin.api.household.adapter.out.persistence.JdbcInviteRepository;
import com.bruzfin.api.household.adapter.out.valkey.ValkeyInviteAttempts;
import com.bruzfin.api.household.application.port.in.AcceptInviteUseCase;
import com.bruzfin.api.household.application.port.in.CreateHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.InviteMemberUseCase;
import com.bruzfin.api.household.application.port.in.RenameHouseholdUseCase;
import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.application.service.CreateHouseholdService;
import com.bruzfin.api.household.application.service.HouseholdUseCases;
import com.bruzfin.api.identity.HouseholdMembership;
import com.bruzfin.api.identity.UserDirectory;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/** Liga os casos de uso do lar aos adapters. */
@Configuration(proxyBeanMethods = false)
class HouseholdModuleConfiguration {

    @Bean
    HouseholdRepository householdRepository(JdbcClient jdbc) {
        return new JdbcHouseholdRepository(jdbc);
    }

    @Bean
    DataScope householdDataScope(JdbcClient jdbc) {
        return new JdbcDataScope(jdbc);
    }

    @Bean
    HouseholdUseCases householdUseCases(HouseholdRepository households, DataScope scope, JdbcClient jdbc,
            UserDirectory users, StringRedisTemplate redis, ObjectProvider<HouseholdDataProbe> probes,
            PlatformTransactionManager transactionManager,
            @Value("${bruzfin.household.invite.max-failures:5}") int maxFailures,
            @Value("${bruzfin.household.invite.failure-window:15m}") Duration failureWindow) {
        return new HouseholdUseCases(households, new JdbcInviteRepository(jdbc), new IdentityMemberProfiles(users),
                scope, new ValkeyInviteAttempts(redis, maxFailures, failureWindow),
                new ProbedHouseholdData(probes.orderedStream().toList()), new SecureRandom(),
                new TransactionTemplate(transactionManager), Clock.systemUTC());
    }

    @Bean
    GetHouseholdUseCase getHouseholdUseCase(HouseholdUseCases useCases) {
        return useCases.get();
    }

    @Bean
    RenameHouseholdUseCase renameHouseholdUseCase(HouseholdUseCases useCases) {
        return useCases.rename();
    }

    @Bean
    InviteMemberUseCase inviteMemberUseCase(HouseholdUseCases useCases) {
        return useCases.invite();
    }

    @Bean
    AcceptInviteUseCase acceptInviteUseCase(HouseholdUseCases useCases) {
        return useCases.accept();
    }

    /** Transação nova: o listener roda depois do commit da transação que criou o usuário. */
    @Bean
    CreateHouseholdUseCase createHouseholdUseCase(HouseholdRepository households, DataScope scope,
            PlatformTransactionManager transactionManager) {
        TransactionTemplate requiresNew = new TransactionTemplate(transactionManager);
        requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return new CreateHouseholdService(households, scope, requiresNew, Clock.systemUTC());
    }

    @Bean
    UserProvisionedListener userProvisionedListener(CreateHouseholdUseCase createHousehold) {
        return new UserProvisionedListener(createHousehold);
    }

    @Bean
    HouseholdMembership householdMembership(GetHouseholdUseCase households) {
        return new HouseholdMembershipAdapter(households);
    }
}

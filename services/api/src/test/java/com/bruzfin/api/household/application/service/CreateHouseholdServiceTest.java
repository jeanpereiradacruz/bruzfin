package com.bruzfin.api.household.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bruzfin.api.household.domain.MemberRole;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Caso de uso: criar o lar automático")
class CreateHouseholdServiceTest {

    private final InMemoryHousehold store = new InMemoryHousehold();
    private final UUID user = UUID.randomUUID();

    @Test
    @DisplayName("cria \"Lar de <primeiro nome>\" com o usuário como dono")
    void createsHousehold() {
        store.create().createFor(user, "Usuário de Teste");

        assertThat(store.households.values()).singleElement()
                .satisfies(h -> assertThat(h.name().value()).isEqualTo("Lar de Usuário"));
        assertThat(store.members.get(user).role()).isEqualTo(MemberRole.OWNER);
    }

    @Test
    @DisplayName("evento repetido não cria um segundo lar")
    void idempotent() {
        store.create().createFor(user, "Usuário de Teste");
        store.create().createFor(user, "Usuário de Teste");

        assertThat(store.households).hasSize(1);
    }

    @Test
    @DisplayName("grava com o novo lar no escopo da Row-Level Security")
    void bindsScope() {
        store.create().createFor(user, "Ana");

        String household = store.members.get(user).householdId().value().toString();
        assertThat(store.scopes).containsExactly(user + "@-", user + "@" + household);
    }
}

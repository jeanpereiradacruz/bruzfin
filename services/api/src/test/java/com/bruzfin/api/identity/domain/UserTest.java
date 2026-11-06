package com.bruzfin.api.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Usuário")
class UserTest {

    private static final Instant T0 = Instant.parse("2026-11-05T12:00:00Z");
    private static final Instant T1 = Instant.parse("2026-11-06T12:00:00Z");

    @Test
    @DisplayName("primeiro acesso cria o usuário com os dados do token")
    void provision() {
        User user = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A"), T0);

        assertThat(user.id().value().version()).isEqualTo(7);
        assertThat(user.subject()).isEqualTo("sub-1");
        assertThat(user.email()).isEqualTo("a@bruzfin.local");
        assertThat(user.name()).isEqualTo("Pessoa A");
        assertThat(user.createdAt()).isEqualTo(T0).isEqualTo(user.updatedAt());
    }

    @Test
    @DisplayName("sincroniza email e nome quando mudam no Keycloak, mantendo id e criação")
    void syncsProfile() {
        User user = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A"), T0);

        User synced = user.syncedWith(new IdentityClaims("sub-1", "novo@bruzfin.local", "Pessoa B"), T1);

        assertThat(synced.id()).isEqualTo(user.id());
        assertThat(synced.email()).isEqualTo("novo@bruzfin.local");
        assertThat(synced.name()).isEqualTo("Pessoa B");
        assertThat(synced.createdAt()).isEqualTo(T0);
        assertThat(synced.updatedAt()).isEqualTo(T1);
    }

    @Test
    @DisplayName("sem mudança no token, devolve o mesmo usuário")
    void unchanged() {
        IdentityClaims claims = new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A");
        User user = User.provision(claims, T0);

        assertThat(user.isInSyncWith(claims)).isTrue();
        assertThat(user.syncedWith(claims, T1)).isSameAs(user);
    }

    @Test
    @DisplayName("não aceita sincronizar com o token de outro usuário")
    void rejectsOtherSubject() {
        User user = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", null), T0);

        assertThatThrownBy(() -> user.syncedWith(new IdentityClaims("sub-2", "a@bruzfin.local", null), T1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("token sem sub ou email é inválido; nome vazio vira nulo")
    void claimsValidation() {
        assertThatThrownBy(() -> new IdentityClaims(" ", "a@bruzfin.local", null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new IdentityClaims("sub-1", " ", null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(new IdentityClaims("sub-1", " a@bruzfin.local ", "  ").name()).isNull();
        assertThat(new IdentityClaims("sub-1", " a@bruzfin.local ", null).email()).isEqualTo("a@bruzfin.local");
    }
}

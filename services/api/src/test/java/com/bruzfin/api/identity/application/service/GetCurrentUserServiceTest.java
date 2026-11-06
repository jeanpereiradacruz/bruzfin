package com.bruzfin.api.identity.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.domain.IdentityClaims;
import com.bruzfin.api.identity.domain.User;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Caso de uso: obter o usuário autenticado")
class GetCurrentUserServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    private final InMemoryUsers users = new InMemoryUsers();
    private final GetCurrentUserService service =
            new GetCurrentUserService(users, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    @DisplayName("no primeiro acesso, cria o usuário")
    void provisionsOnFirstAccess() {
        User user = service.getCurrentUser(new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A"));

        assertThat(users.bySubject).containsOnlyKeys("sub-1");
        assertThat(user.createdAt()).isEqualTo(NOW);
        assertThat(users.inserts).isEqualTo(1);
    }

    @Test
    @DisplayName("nos acessos seguintes, devolve o mesmo usuário sem gravar nada")
    void returnsExistingUser() {
        IdentityClaims claims = new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A");
        User first = service.getCurrentUser(claims);

        User second = service.getCurrentUser(claims);

        assertThat(second.id()).isEqualTo(first.id());
        assertThat(users.inserts).isEqualTo(1);
        assertThat(users.updates).isZero();
    }

    @Test
    @DisplayName("se o email ou o nome mudaram no Keycloak, atualiza o perfil")
    void syncsChangedProfile() {
        User first = service.getCurrentUser(new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A"));

        User synced = service.getCurrentUser(new IdentityClaims("sub-1", "b@bruzfin.local", "Pessoa B"));

        assertThat(synced.id()).isEqualTo(first.id());
        assertThat(users.bySubject.get("sub-1").email()).isEqualTo("b@bruzfin.local");
        assertThat(users.updates).isEqualTo(1);
    }

    @Test
    @DisplayName("se outra requisição criou o usuário antes, usa o que ficou gravado")
    void concurrentFirstAccess() {
        User existing = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", null), NOW);
        users.raceWinner = existing;

        User user = service.getCurrentUser(new IdentityClaims("sub-1", "a@bruzfin.local", null));

        assertThat(user.id()).isEqualTo(existing.id());
    }

    /** Repositório em memória que imita o INSERT ... ON CONFLICT DO NOTHING. */
    private static final class InMemoryUsers implements UserRepository {

        final Map<String, User> bySubject = new HashMap<>();
        User raceWinner;
        int inserts;
        int updates;

        @Override
        public Optional<User> findBySubject(String subject) {
            return Optional.ofNullable(bySubject.get(subject));
        }

        @Override
        public User insertIfAbsent(User user) {
            if (raceWinner != null) {
                bySubject.putIfAbsent(raceWinner.subject(), raceWinner);
            }
            if (bySubject.putIfAbsent(user.subject(), user) == null) {
                inserts++;
            }
            return bySubject.get(user.subject());
        }

        @Override
        public void updateProfile(User user) {
            bySubject.put(user.subject(), user);
            updates++;
        }
    }
}

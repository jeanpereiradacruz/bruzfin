package com.bruzfin.api.household;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bruzfin.api.TestcontainersConfiguration;
import com.bruzfin.api.shared.tenancy.AccessScope;
import com.bruzfin.api.shared.tenancy.AccessScopeHolder;
import com.bruzfin.api.support.KeycloakPkce;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;

/**
 * Lar e convites de ponta a ponta, com tokens reais do Keycloak e a Row-Level Security do PostgreSQL
 * valendo para o usuário da API (sem superusuário).
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "bruzfin.household.invite.max-failures=3",
        "bruzfin.rate-limit.authenticated-capacity=1000"})
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
@DisplayName("Lar, convites e Row-Level Security")
class HouseholdIT {

    @Autowired
    private RestTestClient client;

    @Autowired
    private KeycloakContainer keycloak;

    @Autowired
    private PostgreSQLContainer postgres;

    @Autowired
    private JdbcTemplate appJdbc;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @AfterEach
    void clearScope() {
        AccessScopeHolder.clear();
    }

    private String token(String user) {
        return new KeycloakPkce(keycloak.getAuthServerUrl()).accessToken(user);
    }

    private JsonNode get(String token, String uri) {
        return KeycloakPkce.json(client.get().uri(uri).header("Authorization", "Bearer " + token).exchange()
                .expectStatus().isOk()
                .returnResult(String.class).getResponseBody());
    }

    private RestTestClient.ResponseSpec post(String token, String uri, String json) {
        RestTestClient.RequestBodySpec request = client.post().uri(uri).header("Authorization", "Bearer " + token);
        if (json != null) {
            request.contentType(MediaType.APPLICATION_JSON).body(json);
        }
        return request.exchange();
    }

    /** Conexão de superusuário, só para preparar e conferir dados por fora da RLS. */
    private JdbcTemplate admin() {
        return new JdbcTemplate(new DriverManagerDataSource(
                TestcontainersConfiguration.appJdbcUrl(postgres), postgres.getUsername(), postgres.getPassword()));
    }

    @Test
    @DisplayName("primeiro acesso cria o lar; convidado entra com o código e o lar vazio dele é descartado")
    void inviteFlow() {
        String owner = token(KeycloakPkce.TEST_USER);
        String guest = token(KeycloakPkce.GUEST_USER);

        JsonNode ownerMe = get(owner, "/api/v1/me");
        assertThat(ownerMe.at("/household/name").asString()).isEqualTo("Lar de Usuário");
        assertThat(ownerMe.at("/household/role").asString()).isEqualTo("OWNER");
        UUID ownerHousehold = UUID.fromString(ownerMe.at("/household/id").asString());

        JsonNode guestMe = get(guest, "/api/v1/me");
        assertThat(guestMe.at("/household/name").asString()).isEqualTo("Lar de Pessoa");
        UUID guestHousehold = UUID.fromString(guestMe.at("/household/id").asString());
        assertThat(guestHousehold).isNotEqualTo(ownerHousehold);

        JsonNode invite = KeycloakPkce.json(post(owner, "/api/v1/household/invites", null)
                .expectStatus().isCreated()
                .returnResult(String.class).getResponseBody());
        String code = invite.get("code").asString();
        assertThat(code).matches("[0-9A-Z]{4}-[0-9A-Z]{4}");
        assertThat(Instant.parse(invite.get("expiresAt").asString())).isAfter(Instant.now().plusSeconds(47 * 3600));
        assertThat(admin().queryForObject("select count(*) from household_invite where code_hash like ?",
                Integer.class, "%" + code.replace("-", "") + "%")).as("o código não é gravado").isZero();

        JsonNode joined = KeycloakPkce.json(post(guest, "/api/v1/household/invites/accept",
                "{\"code\":\"" + code.toLowerCase() + "\"}")
                .expectStatus().isOk()
                .returnResult(String.class).getResponseBody());
        assertThat(joined.get("id").asString()).isEqualTo(ownerHousehold.toString());
        assertThat(joined.get("role").asString()).isEqualTo("MEMBER");
        assertThat(joined.get("members").valueStream().map(m -> m.get("email").asString()).toList())
                .containsExactly(KeycloakPkce.TEST_USER, KeycloakPkce.GUEST_USER);

        assertThat(get(guest, "/api/v1/me").at("/household/id").asString()).isEqualTo(ownerHousehold.toString());
        assertThat(get(owner, "/api/v1/household").get("members").size()).isEqualTo(2);
        assertThat(admin().queryForObject("select count(*) from household where id = ?", Integer.class,
                guestHousehold)).as("lar automático vazio do convidado descartado").isZero();

        post(guest, "/api/v1/household/invites/accept", "{\"code\":\"" + code + "\"}")
                .expectStatus().isEqualTo(409)
                .expectBody().jsonPath("$.code").isEqualTo("household.already-member");

        client.patch().uri("/api/v1/household").header("Authorization", "Bearer " + guest)
                .contentType(MediaType.APPLICATION_JSON).body("{\"name\":\"Casa da família\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.name").isEqualTo("Casa da família");
        assertThat(get(owner, "/api/v1/me").at("/household/name").asString()).isEqualTo("Casa da família");
    }

    @Test
    @DisplayName("tentativas erradas em excesso bloqueiam o aceite temporariamente")
    void blocksAfterTooManyWrongCodes() {
        String owner = token(KeycloakPkce.TEST_USER);
        for (int i = 0; i < 3; i++) {
            post(owner, "/api/v1/household/invites/accept", "{\"code\":\"ZZZZ-ZZZZ\"}")
                    .expectStatus().isNotFound()
                    .expectBody().jsonPath("$.code").isEqualTo("household.invite-not-found");
        }
        post(owner, "/api/v1/household/invites/accept", "{\"code\":\"ZZZZ-ZZZZ\"}")
                .expectStatus().isEqualTo(429)
                .expectHeader().exists("Retry-After")
                .expectBody().jsonPath("$.code").isEqualTo("household.too-many-attempts");
    }

    @Test
    @DisplayName("Row-Level Security: consulta sem filtro só enxerga o próprio lar, e sem escopo não enxerga nada")
    void rowLevelSecurityIsolatesHouseholds() {
        JsonNode me = get(token(KeycloakPkce.TEST_USER), "/api/v1/me");
        UUID user = UUID.fromString(me.get("id").asString());
        UUID household = UUID.fromString(me.at("/household/id").asString());

        UUID otherHousehold = UUID.randomUUID();
        JdbcTemplate admin = admin();
        admin.update("insert into household (id, name, created_at, updated_at) values (?, 'Lar de outra pessoa', now(), now())",
                otherHousehold);
        UUID otherUser = UUID.randomUUID();
        admin.update("insert into app_user (id, keycloak_sub, email, name, created_at, updated_at) "
                + "values (?, ?, 'outra@bruzfin.local', 'Outra Pessoa', now(), now())", otherUser, "sub-" + otherUser);
        admin.update("insert into household_member (household_id, user_id, role, joined_at) values (?, ?, 'OWNER', now())",
                otherHousehold, otherUser);
        assertThat(admin.queryForObject("select count(*) from household", Integer.class)).isGreaterThanOrEqualTo(2);

        TransactionTemplate tx = new TransactionTemplate(transactionManager);

        AccessScopeHolder.set(new AccessScope(user, household));
        List<UUID> visible = tx.execute(s -> appJdbc.queryForList("select id from household", UUID.class));
        List<UUID> memberHouseholds = tx.execute(s ->
                appJdbc.queryForList("select distinct household_id from household_member", UUID.class));
        assertThat(visible).containsExactly(household);
        assertThat(memberHouseholds).containsExactly(household);

        assertThatThrownBy(() -> tx.executeWithoutResult(s -> appJdbc.update(
                "insert into household_member (household_id, user_id, role, joined_at) values (?, ?, 'MEMBER', now())",
                otherHousehold, user)))
                .as("não grava em outro lar")
                .isInstanceOf(DataAccessException.class)
                .rootCause().hasMessageContaining("row-level security");
        Integer deleted = tx.execute(s -> appJdbc.update("delete from household where id = ?", otherHousehold));
        assertThat(deleted).as("não apaga outro lar").isZero();

        AccessScopeHolder.clear();
        Integer unscoped = tx.execute(s -> appJdbc.queryForObject("select count(*) from household", Integer.class));
        assertThat(unscoped).as("sem escopo, nada").isZero();
        assertThat(appJdbc.queryForObject("select count(*) from household_member", Integer.class))
                .as("fora de transação também nada").isZero();
    }
}

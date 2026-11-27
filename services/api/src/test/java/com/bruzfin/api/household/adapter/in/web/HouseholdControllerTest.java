package com.bruzfin.api.household.adapter.in.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bruzfin.api.household.application.port.in.AcceptInviteUseCase;
import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.in.InviteMemberUseCase;
import com.bruzfin.api.household.application.port.in.IssuedInvite;
import com.bruzfin.api.household.application.port.in.RenameHouseholdUseCase;
import com.bruzfin.api.household.domain.HouseholdException;
import com.bruzfin.api.household.domain.HouseholdException.Reason;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.MemberRole;
import com.bruzfin.api.platform.security.SecurityConfiguration;
import com.bruzfin.api.shared.tenancy.AccessScope;
import com.bruzfin.api.shared.tenancy.AccessScopeHolder;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@WebMvcTest(controllers = HouseholdController.class,
        properties = "bruzfin.security.issuer-uri=http://issuer.test/realms/bruzfin")
@Import(SecurityConfiguration.class)
@DisplayName("API do lar")
class HouseholdControllerTest {

    private static final UUID USER = UUID.randomUUID();
    private static final HouseholdId HOUSEHOLD = HouseholdId.newId();
    private static final HouseholdView VIEW = new HouseholdView(HOUSEHOLD, "Lar de Pessoa", MemberRole.OWNER,
            List.of(new HouseholdView.MemberView(USER, "a@bruzfin.local", "Pessoa A", MemberRole.OWNER,
                    Instant.parse("2026-11-27T12:00:00Z"))));

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private GetHouseholdUseCase getHousehold;

    @MockitoBean
    private RenameHouseholdUseCase renameHousehold;

    @MockitoBean
    private InviteMemberUseCase inviteMember;

    @MockitoBean
    private AcceptInviteUseCase acceptInvite;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    /** Em produção o interceptor da identidade preenche o escopo; aqui ele é simulado. */
    @BeforeEach
    void scope() {
        AccessScopeHolder.set(new AccessScope(USER, HOUSEHOLD.value()));
    }

    @AfterEach
    void clearScope() {
        AccessScopeHolder.clear();
    }

    private static RequestPostProcessor user() {
        return jwt().jwt(token -> token.subject("sub-1").claim("email", "a@bruzfin.local").claim("email_verified", true));
    }

    @Test
    @DisplayName("GET devolve o lar com o papel e os membros")
    void getsHousehold() throws Exception {
        given(getHousehold.get(USER)).willReturn(VIEW);

        mvc.perform(get("/api/v1/household").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(HOUSEHOLD.value().toString()))
                .andExpect(jsonPath("$.name").value("Lar de Pessoa"))
                .andExpect(jsonPath("$.role").value("OWNER"))
                .andExpect(jsonPath("$.members[0].id").value(USER.toString()))
                .andExpect(jsonPath("$.members[0].email").value("a@bruzfin.local"))
                .andExpect(jsonPath("$.members[0].role").value("OWNER"))
                .andExpect(jsonPath("$.members[0].joinedAt").value("2026-11-27T12:00:00Z"));
    }

    @Test
    @DisplayName("sem token responde 401")
    void requiresToken() throws Exception {
        mvc.perform(get("/api/v1/household")).andExpect(status().isUnauthorized());
        verifyNoInteractions(getHousehold);
    }

    @Test
    @DisplayName("PATCH troca o nome")
    void renames() throws Exception {
        given(renameHousehold.rename(USER, "Casa")).willReturn(VIEW);

        mvc.perform(patch("/api/v1/household").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Casa\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH com nome vazio ou longo demais responde 400 sem chamar o caso de uso")
    void validatesName() throws Exception {
        mvc.perform(patch("/api/v1/household").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/household").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + "a".repeat(61) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(renameHousehold);
    }

    @Test
    @DisplayName("POST /invites gera o código e responde 201")
    void createsInvite() throws Exception {
        given(inviteMember.invite(USER)).willReturn(new IssuedInvite("ABCD-1230", Instant.parse("2026-11-29T12:00:00Z")));

        mvc.perform(post("/api/v1/household/invites").with(user()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("ABCD-1230"))
                .andExpect(jsonPath("$.expiresAt").value("2026-11-29T12:00:00Z"));
    }

    @Test
    @DisplayName("POST /invites/accept entra no lar")
    void acceptsInvite() throws Exception {
        given(acceptInvite.accept(USER, "abcd-1230")).willReturn(VIEW);

        mvc.perform(post("/api/v1/household/invites/accept").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"abcd-1230\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Lar de Pessoa"));
    }

    static Stream<Arguments> problems() {
        return Stream.of(
                Arguments.of(Reason.INVITE_NOT_FOUND, 404, "household.invite-not-found"),
                Arguments.of(Reason.INVITE_EXPIRED, 410, "household.invite-expired"),
                Arguments.of(Reason.INVITE_ALREADY_USED, 409, "household.invite-already-used"),
                Arguments.of(Reason.ALREADY_MEMBER, 409, "household.already-member"),
                Arguments.of(Reason.GUEST_HOUSEHOLD_NOT_EMPTY, 409, "household.guest-household-not-empty"),
                Arguments.of(Reason.ATTEMPTS_UNAVAILABLE, 503, "household.attempts-unavailable"));
    }

    @ParameterizedTest(name = "{0} responde {1} com code {2}")
    @MethodSource("problems")
    @DisplayName("convite recusado responde Problem Details com code estável e mensagem em português")
    void mapsProblems(Reason reason, int status, String code) throws Exception {
        given(acceptInvite.accept(eq(USER), any())).willThrow(new HouseholdException(reason));

        mvc.perform(post("/api/v1/household/invites/accept").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"ABCD-1230\"}"))
                .andExpect(status().is(status))
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.detail").value(reason.message()));
    }

    @Test
    @DisplayName("muitas tentativas erradas respondem 429 com Retry-After")
    void tooManyAttempts() throws Exception {
        given(acceptInvite.accept(eq(USER), any()))
                .willThrow(new HouseholdException(Reason.TOO_MANY_ATTEMPTS, Duration.ofMinutes(12)));

        mvc.perform(post("/api/v1/household/invites/accept").with(user())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"ABCD-1230\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "720"))
                .andExpect(jsonPath("$.code").value("household.too-many-attempts"));
    }

    @Test
    @DisplayName("lar ainda em preparação responde 409")
    void notReady() throws Exception {
        given(getHousehold.get(USER)).willThrow(new HouseholdException(Reason.HOUSEHOLD_NOT_READY));

        mvc.perform(get("/api/v1/household").with(user()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("household.household-not-ready"));
    }
}

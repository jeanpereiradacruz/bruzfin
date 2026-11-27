package com.bruzfin.api.identity.adapter.in.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bruzfin.api.identity.HouseholdMembership;
import com.bruzfin.api.identity.HouseholdMembership.Membership;
import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.domain.IdentityClaims;
import com.bruzfin.api.identity.domain.User;
import com.bruzfin.api.platform.security.SecurityConfiguration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = MeController.class,
        properties = "bruzfin.security.issuer-uri=http://issuer.test/realms/bruzfin")
@Import(SecurityConfiguration.class)
@DisplayName("GET /api/v1/me")
class MeControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private GetCurrentUserUseCase getCurrentUser;

    @MockitoBean
    private HouseholdMembership households;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("sem token responde 401 com WWW-Authenticate e Problem Details")
    void requiresToken() throws Exception {
        mvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", org.hamcrest.Matchers.startsWith("Bearer")))
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("com email não confirmado responde 403")
    void requiresVerifiedEmail() throws Exception {
        mvc.perform(get("/api/v1/me").with(jwt().jwt(token -> token
                        .subject("sub-1").claim("email", "a@bruzfin.local").claim("email_verified", false))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("com token válido devolve o perfil com o lar e o papel do usuário")
    void returnsProfile() throws Exception {
        User user = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", "Pessoa A"), Instant.now());
        UUID household = UUID.randomUUID();
        given(getCurrentUser.getCurrentUser(any())).willReturn(user);
        given(households.findFor(user.id().value()))
                .willReturn(Optional.of(new Membership(household, "Lar de Pessoa", "OWNER")));

        mvc.perform(get("/api/v1/me").with(jwt().jwt(token -> token
                        .subject("sub-1").claim("email", "a@bruzfin.local")
                        .claim("email_verified", true).claim("name", "Pessoa A"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.id().value().toString()))
                .andExpect(jsonPath("$.email").value("a@bruzfin.local"))
                .andExpect(jsonPath("$.name").value("Pessoa A"))
                .andExpect(jsonPath("$.household.id").value(household.toString()))
                .andExpect(jsonPath("$.household.name").value("Lar de Pessoa"))
                .andExpect(jsonPath("$.household.role").value("OWNER"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("enquanto o lar automático não fica pronto, o perfil vem sem lar")
    void returnsProfileWithoutHousehold() throws Exception {
        User user = User.provision(new IdentityClaims("sub-1", "a@bruzfin.local", null), Instant.now());
        given(getCurrentUser.getCurrentUser(any())).willReturn(user);
        given(households.findFor(user.id().value())).willReturn(Optional.empty());

        mvc.perform(get("/api/v1/me").with(jwt().jwt(token -> token
                        .subject("sub-1").claim("email", "a@bruzfin.local").claim("email_verified", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.household").doesNotExist());
    }

    @Test
    @DisplayName("CSRF continua ativo para quem não usa Bearer e não atrapalha quem usa")
    void csrfOnlyIgnoresBearerRequests() throws Exception {
        given(jwtDecoder.decode("token-valido")).willReturn(Jwt.withTokenValue("token-valido")
                .header("alg", "RS256").subject("sub-1")
                .claim("email", "a@bruzfin.local").claim("email_verified", true).build());

        mvc.perform(post("/api/v1/me"))
                .andExpect(status().isForbidden());
        // Com Bearer passa pelo CSRF e chega no controller, que não aceita POST.
        mvc.perform(post("/api/v1/me").header("Authorization", "Bearer token-valido"))
                .andExpect(status().isMethodNotAllowed());
    }
}

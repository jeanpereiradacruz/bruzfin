package com.bruzfin.api.about.adapter.in.web;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bruzfin.api.about.application.port.in.GetAboutInfoUseCase;
import com.bruzfin.api.about.domain.AboutInfo;
import com.bruzfin.api.platform.security.SecurityConfiguration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AboutController.class,
        properties = "bruzfin.security.issuer-uri=http://issuer.test/realms/bruzfin")
@Import(SecurityConfiguration.class)
@DisplayName("GET /api/v1/about")
class AboutControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private GetAboutInfoUseCase getAboutInfo;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("responde com nome e versão da API")
    void returnsAboutInfo() throws Exception {
        given(getAboutInfo.getAboutInfo()).willReturn(new AboutInfo("BruzFin API", "0.1.0"));

        mvc.perform(get("/api/v1/about").with(jwt().jwt(token -> token
                        .claim("email", "a@bruzfin.local").claim("email_verified", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("BruzFin API"))
                .andExpect(jsonPath("$.version").value("0.1.0"));
    }

    @Test
    @DisplayName("exige token")
    void requiresToken() throws Exception {
        mvc.perform(get("/api/v1/about")).andExpect(status().isUnauthorized());
    }
}

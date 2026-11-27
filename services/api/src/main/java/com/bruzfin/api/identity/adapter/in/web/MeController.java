package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.HouseholdMembership;
import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@PrimaryAdapter
@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "Identidade", description = "Usuário autenticado")
class MeController {

    private final GetCurrentUserUseCase getCurrentUser;
    private final HouseholdMembership households;

    MeController(GetCurrentUserUseCase getCurrentUser, HouseholdMembership households) {
        this.getCurrentUser = getCurrentUser;
        this.households = households;
    }

    @GetMapping
    @Operation(operationId = "getMe", summary = "Perfil do usuário autenticado, com o lar e o papel dele")
    MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        User user = getCurrentUser.getCurrentUser(AuthenticatedClaims.from(jwt));
        return MeResponse.from(user, households.findFor(user.id().value()).orElse(null));
    }
}

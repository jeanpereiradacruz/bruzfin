package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.domain.IdentityClaims;
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

    MeController(GetCurrentUserUseCase getCurrentUser) {
        this.getCurrentUser = getCurrentUser;
    }

    @GetMapping
    @Operation(operationId = "getMe", summary = "Perfil do usuário autenticado (criado no primeiro acesso)")
    MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        IdentityClaims claims = new IdentityClaims(
                jwt.getSubject(), jwt.getClaimAsString("email"), jwt.getClaimAsString("name"));
        return MeResponse.from(getCurrentUser.getCurrentUser(claims));
    }
}

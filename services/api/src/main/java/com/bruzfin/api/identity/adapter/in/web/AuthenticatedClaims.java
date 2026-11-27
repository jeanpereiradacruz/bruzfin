package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.domain.IdentityClaims;
import org.springframework.security.oauth2.jwt.Jwt;

/** Converte o token do Keycloak no que a identidade precisa saber. */
final class AuthenticatedClaims {

    private AuthenticatedClaims() {
    }

    static IdentityClaims from(Jwt jwt) {
        return new IdentityClaims(jwt.getSubject(), jwt.getClaimAsString("email"), jwt.getClaimAsString("name"));
    }
}

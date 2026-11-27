package com.bruzfin.api.identity.adapter.in.web;

import com.bruzfin.api.identity.HouseholdMembership;
import com.bruzfin.api.identity.HouseholdMembership.Membership;
import com.bruzfin.api.identity.application.port.in.GetCurrentUserUseCase;
import com.bruzfin.api.identity.domain.User;
import com.bruzfin.api.shared.tenancy.AccessScope;
import com.bruzfin.api.shared.tenancy.AccessScopeHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Depois da autenticação, descobre o usuário (criando-o no primeiro acesso) e o lar dele e
 * deixa o {@link AccessScope} disponível para todos os módulos durante a requisição.
 */
@PrimaryAdapter
final class AccessScopeInterceptor implements HandlerInterceptor {

    private final GetCurrentUserUseCase getCurrentUser;
    private final HouseholdMembership households;

    AccessScopeInterceptor(GetCurrentUserUseCase getCurrentUser, HouseholdMembership households) {
        this.getCurrentUser = getCurrentUser;
        this.households = households;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        AccessScopeHolder.clear();
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken token) {
            User user = getCurrentUser.getCurrentUser(AuthenticatedClaims.from(token.getToken()));
            UUID userId = user.id().value();
            UUID householdId = households.findFor(userId).map(Membership::householdId).orElse(null);
            AccessScopeHolder.set(new AccessScope(userId, householdId));
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            Exception ex) {
        AccessScopeHolder.clear();
    }
}

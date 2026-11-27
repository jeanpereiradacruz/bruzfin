package com.bruzfin.api.identity;

import java.util.Objects;
import java.util.UUID;
import org.jmolecules.event.annotation.DomainEvent;

/**
 * Evento publicado quando o usuário é criado no primeiro acesso.
 * Guardado no registro de eventos do Spring Modulith (outbox) junto com o usuário.
 *
 * @param userId      id do usuário na API
 * @param displayName nome para exibição (nome do perfil ou, sem ele, a parte do email antes do @)
 */
@DomainEvent
public record UserProvisioned(UUID userId, String displayName) {

    public UserProvisioned {
        Objects.requireNonNull(userId, "userId");
        Objects.requireNonNull(displayName, "displayName");
    }
}

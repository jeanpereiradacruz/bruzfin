package com.bruzfin.api.identity.domain;

import com.bruzfin.api.shared.domain.UuidV7;
import java.util.Objects;
import java.util.UUID;
import org.jmolecules.ddd.annotation.ValueObject;

/** Identificador do usuário na API (UUIDv7). Diferente do {@code sub} do Keycloak. */
@ValueObject
public record UserId(UUID value) {

    public UserId {
        Objects.requireNonNull(value, "value");
    }

    public static UserId newId() {
        return new UserId(UuidV7.next());
    }
}

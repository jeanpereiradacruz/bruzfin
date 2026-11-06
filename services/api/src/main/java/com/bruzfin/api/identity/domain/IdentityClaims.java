package com.bruzfin.api.identity.domain;

import java.util.Objects;
import org.jmolecules.ddd.annotation.ValueObject;

/** O que o token do Keycloak diz sobre o usuário autenticado. */
@ValueObject
public record IdentityClaims(String subject, String email, String name) {

    static final int MAX_EMAIL = 320;
    static final int MAX_NAME = 200;

    public IdentityClaims {
        Objects.requireNonNull(subject, "subject");
        Objects.requireNonNull(email, "email");
        if (subject.isBlank()) {
            throw new IllegalArgumentException("O token não identifica o usuário (sub vazio)");
        }
        email = email.strip();
        if (email.isEmpty() || email.length() > MAX_EMAIL) {
            throw new IllegalArgumentException("Email inválido no token");
        }
        name = name == null || name.isBlank() ? null : truncate(name.strip(), MAX_NAME);
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }
}

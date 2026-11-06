package com.bruzfin.api.identity.domain;

import java.time.Instant;
import java.util.Objects;
import org.jmolecules.ddd.annotation.AggregateRoot;
import org.jmolecules.ddd.annotation.Identity;

/** Usuário da API, vinculado a uma conta do Keycloak pelo {@code subject}. */
@AggregateRoot
public record User(
        @Identity UserId id,
        String subject,
        String email,
        String name,
        Instant createdAt,
        Instant updatedAt) {

    public User {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(subject, "subject");
        Objects.requireNonNull(email, "email");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(updatedAt, "updatedAt");
    }

    /** Primeiro acesso: cria o usuário a partir do token. */
    public static User provision(IdentityClaims claims, Instant now) {
        return new User(UserId.newId(), claims.subject(), claims.email(), claims.name(), now, now);
    }

    /** O perfil guardado já é igual ao do token? */
    public boolean isInSyncWith(IdentityClaims claims) {
        return email.equals(claims.email()) && Objects.equals(name, claims.name());
    }

    /** Atualiza email e nome com o que veio do token (o Keycloak é a fonte da verdade). */
    public User syncedWith(IdentityClaims claims, Instant now) {
        if (!subject.equals(claims.subject())) {
            throw new IllegalArgumentException("O token pertence a outro usuário");
        }
        return isInSyncWith(claims) ? this : new User(id, subject, claims.email(), claims.name(), createdAt, now);
    }
}

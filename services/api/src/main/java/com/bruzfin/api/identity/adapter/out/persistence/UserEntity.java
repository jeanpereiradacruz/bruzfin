package com.bruzfin.api.identity.adapter.out.persistence;

import com.bruzfin.api.identity.domain.User;
import com.bruzfin.api.identity.domain.UserId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
class UserEntity {

    @Id
    private UUID id;

    @Column(name = "keycloak_sub", nullable = false, updatable = false)
    private String subject;

    @Column(nullable = false)
    private String email;

    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserEntity() {
    }

    User toDomain() {
        return new User(new UserId(id), subject, email, name, createdAt, updatedAt);
    }
}

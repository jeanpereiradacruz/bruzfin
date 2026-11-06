package com.bruzfin.api.identity.adapter.out.persistence;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findBySubject(String subject);

    @Transactional
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO app_user (id, keycloak_sub, email, name, created_at, updated_at)
            VALUES (:id, :subject, :email, :name, :createdAt, :updatedAt)
            ON CONFLICT (keycloak_sub) DO NOTHING
            """)
    int insertIfAbsent(
            @Param("id") UUID id,
            @Param("subject") String subject,
            @Param("email") String email,
            @Param("name") String name,
            @Param("createdAt") Instant createdAt,
            @Param("updatedAt") Instant updatedAt);

    @Transactional
    @Modifying
    @Query("update UserEntity u set u.email = :email, u.name = :name, u.updatedAt = :updatedAt where u.id = :id")
    int updateProfile(
            @Param("id") UUID id,
            @Param("email") String email,
            @Param("name") String name,
            @Param("updatedAt") Instant updatedAt);
}

package com.bruzfin.api.identity.adapter.out.persistence;

import com.bruzfin.api.identity.application.port.out.UserRepository;
import com.bruzfin.api.identity.domain.User;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;

@SecondaryAdapter
final class UserPersistenceAdapter implements UserRepository {

    private final UserJpaRepository jpa;

    UserPersistenceAdapter(UserJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<User> findBySubject(String subject) {
        return jpa.findBySubject(subject).map(UserEntity::toDomain);
    }

    @Override
    public User insertIfAbsent(User user) {
        jpa.insertIfAbsent(user.id().value(), user.subject(), user.email(), user.name(),
                user.createdAt(), user.updatedAt());
        return findBySubject(user.subject())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado logo após a gravação"));
    }

    @Override
    public void updateProfile(User user) {
        jpa.updateProfile(user.id().value(), user.email(), user.name(), user.updatedAt());
    }
}

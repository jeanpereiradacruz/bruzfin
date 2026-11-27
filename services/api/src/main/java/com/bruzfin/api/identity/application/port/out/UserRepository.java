package com.bruzfin.api.identity.application.port.out;

import com.bruzfin.api.identity.domain.User;
import com.bruzfin.api.identity.domain.UserId;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface UserRepository {

    Optional<User> findBySubject(String subject);

    List<User> findByIds(Collection<UserId> ids);

    /**
     * Grava o usuário se ainda não existir outro com o mesmo {@code subject} e devolve o que ficou gravado.
     * Duas primeiras requisições ao mesmo tempo terminam com um único usuário.
     */
    User insertIfAbsent(User user);

    void updateProfile(User user);
}

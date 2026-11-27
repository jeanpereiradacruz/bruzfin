package com.bruzfin.api.household.adapter.in.event;

import com.bruzfin.api.household.application.port.in.CreateHouseholdUseCase;
import com.bruzfin.api.identity.UserProvisioned;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Cria o lar automático quando o módulo de identidade cria um usuário.
 * Roda logo depois do commit do usuário, na mesma requisição (o primeiro {@code /me} já traz o lar).
 * Se falhar, a publicação fica pendente no registro do Modulith e é reenviada quando a API reinicia.
 */
@PrimaryAdapter
public class UserProvisionedListener {

    private final CreateHouseholdUseCase createHousehold;

    public UserProvisionedListener(CreateHouseholdUseCase createHousehold) {
        this.createHousehold = createHousehold;
    }

    @TransactionalEventListener
    public void on(UserProvisioned event) {
        createHousehold.createFor(event.userId(), event.displayName());
    }
}

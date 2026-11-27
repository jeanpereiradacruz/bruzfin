package com.bruzfin.api.household.application.port.out;

import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Invite;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface InviteRepository {

    void insert(Invite invite);

    /** Invalida os convites ainda não usados do lar. */
    void deletePending(HouseholdId householdId);

    /** Busca e trava o convite até o fim da transação (dois aceites ao mesmo tempo não usam o mesmo código). */
    Optional<Invite> findByCodeHashForUpdate(String codeHash);

    void markUsed(Invite invite);
}

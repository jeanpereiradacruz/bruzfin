package com.bruzfin.api.household.application.port.out;

import com.bruzfin.api.household.domain.HouseholdId;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/**
 * Diz ao banco quem está agindo na transação atual (Row-Level Security). Vale até o fim da transação
 * e pode ser trocado no meio dela (ex.: ao entrar em outro lar).
 */
@SecondaryPort
public interface DataScope {

    /** @param householdId lar do usuário; {@code null} enquanto ele não tiver um */
    void bind(UUID userId, HouseholdId householdId);

    /** Libera a leitura do convite com este hash: só quem digitou o código o enxerga. */
    void allowInvite(String codeHash);
}

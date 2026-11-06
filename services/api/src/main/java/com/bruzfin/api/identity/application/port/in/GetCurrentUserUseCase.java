package com.bruzfin.api.identity.application.port.in;

import com.bruzfin.api.identity.domain.IdentityClaims;
import com.bruzfin.api.identity.domain.User;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: obter o usuário autenticado, criando-o no primeiro acesso. */
@PrimaryPort
public interface GetCurrentUserUseCase {

    User getCurrentUser(IdentityClaims claims);
}

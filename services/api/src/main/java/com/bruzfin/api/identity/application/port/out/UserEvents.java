package com.bruzfin.api.identity.application.port.out;

import com.bruzfin.api.identity.domain.User;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/** Publica os eventos do módulo para os outros módulos (pelo registro de eventos do Modulith). */
@SecondaryPort
public interface UserEvents {

    void provisioned(User user);
}

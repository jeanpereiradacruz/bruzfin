package com.bruzfin.api.about.application.port.out;

import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/** Fonte da versão do build (ex.: META-INF/build-info.properties gerado pelo Maven). */
@SecondaryPort
public interface BuildInfoPort {

    Optional<String> version();
}

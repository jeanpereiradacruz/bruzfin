package com.bruzfin.api.about.application.port.in;

import com.bruzfin.api.about.domain.AboutInfo;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/** Caso de uso: obter nome e versão da API. */
@PrimaryPort
public interface GetAboutInfoUseCase {

    AboutInfo getAboutInfo();
}

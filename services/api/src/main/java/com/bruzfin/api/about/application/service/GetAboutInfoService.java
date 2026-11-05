package com.bruzfin.api.about.application.service;

import com.bruzfin.api.about.application.port.in.GetAboutInfoUseCase;
import com.bruzfin.api.about.application.port.out.BuildInfoPort;
import com.bruzfin.api.about.domain.AboutInfo;
import java.util.Objects;

/** Implementação do caso de uso. Sem anotações do Spring: a ligação fica em {@code adapter.config}. */
public final class GetAboutInfoService implements GetAboutInfoUseCase {

    static final String API_NAME = "BruzFin API";

    private final BuildInfoPort buildInfo;

    public GetAboutInfoService(BuildInfoPort buildInfo) {
        this.buildInfo = Objects.requireNonNull(buildInfo, "buildInfo");
    }

    @Override
    public AboutInfo getAboutInfo() {
        return new AboutInfo(API_NAME, buildInfo.version().orElse(AboutInfo.UNKNOWN_VERSION));
    }
}

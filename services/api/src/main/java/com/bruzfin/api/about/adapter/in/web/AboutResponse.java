package com.bruzfin.api.about.adapter.in.web;

import com.bruzfin.api.about.domain.AboutInfo;
import io.swagger.v3.oas.annotations.media.Schema;

/** DTO da resposta HTTP: o domínio nunca é serializado diretamente. */
@Schema(name = "About", description = "Nome e versão da API")
record AboutResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String version) {

    static AboutResponse from(AboutInfo info) {
        return new AboutResponse(info.name(), info.version());
    }
}

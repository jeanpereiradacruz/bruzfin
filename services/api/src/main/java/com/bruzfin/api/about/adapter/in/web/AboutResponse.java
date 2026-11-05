package com.bruzfin.api.about.adapter.in.web;

import com.bruzfin.api.about.domain.AboutInfo;

/** DTO da resposta HTTP: o domínio nunca é serializado diretamente. */
record AboutResponse(String name, String version) {

    static AboutResponse from(AboutInfo info) {
        return new AboutResponse(info.name(), info.version());
    }
}

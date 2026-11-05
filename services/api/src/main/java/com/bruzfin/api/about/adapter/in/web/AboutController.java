package com.bruzfin.api.about.adapter.in.web;

import com.bruzfin.api.about.application.port.in.GetAboutInfoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@PrimaryAdapter
@RestController
@RequestMapping("/api/v1/about")
@Tag(name = "Sobre", description = "Identificação da API")
class AboutController {

    private final GetAboutInfoUseCase getAboutInfo;

    AboutController(GetAboutInfoUseCase getAboutInfo) {
        this.getAboutInfo = getAboutInfo;
    }

    @GetMapping
    @Operation(summary = "Nome e versão da API")
    AboutResponse about() {
        return AboutResponse.from(getAboutInfo.getAboutInfo());
    }
}

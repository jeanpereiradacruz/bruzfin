package com.bruzfin.api.about.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bruzfin.api.about.domain.AboutInfo;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Caso de uso: obter informações da API")
class GetAboutInfoServiceTest {

    @Test
    @DisplayName("retorna o nome da API e a versão do build")
    void returnsBuildVersion() {
        var service = new GetAboutInfoService(() -> Optional.of("1.2.3"));

        assertThat(service.getAboutInfo()).isEqualTo(new AboutInfo("BruzFin API", "1.2.3"));
    }

    @Test
    @DisplayName("usa 'desconhecida' quando não há informação de build")
    void fallsBackWhenVersionIsMissing() {
        var service = new GetAboutInfoService(Optional::empty);

        assertThat(service.getAboutInfo().version()).isEqualTo(AboutInfo.UNKNOWN_VERSION);
    }

    @Test
    @DisplayName("exige a porta de build info")
    void requiresPort() {
        assertThatThrownBy(() -> new GetAboutInfoService(null)).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("versão em branco vira 'desconhecida'")
    void blankVersionBecomesUnknown() {
        assertThat(new AboutInfo("BruzFin API", " ").version()).isEqualTo(AboutInfo.UNKNOWN_VERSION);
    }
}

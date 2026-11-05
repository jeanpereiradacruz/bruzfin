package com.bruzfin.api.architecture;

import com.bruzfin.api.BruzfinApiApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

@DisplayName("Módulos do Spring Modulith")
class ModularityTest {

    @Test
    @DisplayName("módulos só se comunicam pela API pública, sem ciclos")
    void verifiesModuleStructure() {
        ApplicationModules.of(BruzfinApiApplication.class).verify();
    }
}

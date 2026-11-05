package com.bruzfin.api.about.adapter.config;

import com.bruzfin.api.about.adapter.out.buildinfo.SpringBuildInfoAdapter;
import com.bruzfin.api.about.application.port.in.GetAboutInfoUseCase;
import com.bruzfin.api.about.application.port.out.BuildInfoPort;
import com.bruzfin.api.about.application.service.GetAboutInfoService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Liga o caso de uso às suas portas de saída. */
@Configuration(proxyBeanMethods = false)
class AboutModuleConfiguration {

    @Bean
    BuildInfoPort buildInfoPort(ObjectProvider<BuildProperties> buildProperties) {
        return new SpringBuildInfoAdapter(buildProperties);
    }

    @Bean
    GetAboutInfoUseCase getAboutInfoUseCase(BuildInfoPort buildInfoPort) {
        return new GetAboutInfoService(buildInfoPort);
    }
}

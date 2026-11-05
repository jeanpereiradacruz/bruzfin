package com.bruzfin.api.about.adapter.out.buildinfo;

import com.bruzfin.api.about.application.port.out.BuildInfoPort;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;

/** Lê a versão do {@link BuildProperties} do Spring Boot (ausente quando roda sem build-info). */
@SecondaryAdapter
public class SpringBuildInfoAdapter implements BuildInfoPort {

    private final ObjectProvider<BuildProperties> buildProperties;

    public SpringBuildInfoAdapter(ObjectProvider<BuildProperties> buildProperties) {
        this.buildProperties = buildProperties;
    }

    @Override
    public Optional<String> version() {
        return Optional.ofNullable(buildProperties.getIfAvailable()).map(BuildProperties::getVersion);
    }
}

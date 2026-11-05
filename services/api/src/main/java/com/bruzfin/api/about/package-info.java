/**
 * Módulo "sobre": informa nome e versão da API.
 *
 * <p>É o módulo de referência da arquitetura hexagonal do projeto:
 * <ul>
 *   <li>{@code domain}: modelo puro, sem framework;</li>
 *   <li>{@code application.port.in}: casos de uso oferecidos pelo módulo;</li>
 *   <li>{@code application.port.out}: o que o módulo precisa do mundo externo;</li>
 *   <li>{@code application.service}: implementação dos casos de uso;</li>
 *   <li>{@code adapter.in}: entradas (REST); {@code adapter.out}: saídas (build info, banco, Kafka);</li>
 *   <li>{@code adapter.config}: liga casos de uso e adapters no Spring.</li>
 * </ul>
 */
@ApplicationModule(displayName = "Sobre")
package com.bruzfin.api.about;

import org.springframework.modulith.ApplicationModule;

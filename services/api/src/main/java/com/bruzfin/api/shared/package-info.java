/**
 * Núcleo compartilhado (shared kernel): tipos pequenos e estáveis usados por vários módulos,
 * sem regra de negócio de nenhum deles. Módulo aberto: todos os pacotes são API pública.
 */
@ApplicationModule(displayName = "Compartilhado", type = ApplicationModule.Type.OPEN)
package com.bruzfin.api.shared;

import org.springframework.modulith.ApplicationModule;

/**
 * Módulo de identidade: o usuário da API, criado no primeiro acesso a partir do token do Keycloak.
 * A senha e o login ficam no Keycloak; aqui só existem o vínculo ({@code sub}) e o perfil.
 */
@ApplicationModule(displayName = "Identidade")
package com.bruzfin.api.identity;

import org.springframework.modulith.ApplicationModule;

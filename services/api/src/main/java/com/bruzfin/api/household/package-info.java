/**
 * Módulo do lar: o grupo de usuários que compartilha o monitoramento de contas.
 * Cada usuário pertence a um único lar; o lar automático nasce do evento de usuário criado
 * e outros usuários entram por código de convite.
 */
@ApplicationModule(displayName = "Lar")
package com.bruzfin.api.household;

import org.springframework.modulith.ApplicationModule;

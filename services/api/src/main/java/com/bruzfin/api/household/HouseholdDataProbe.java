package com.bruzfin.api.household;

import java.util.UUID;

/**
 * Implementado pelos módulos que guardam dados do lar (contas, lançamentos...).
 * Antes de descartar o lar automático de quem aceita um convite, o módulo do lar pergunta
 * a cada um se há dados próprios ali; havendo, o aceite é recusado.
 */
public interface HouseholdDataProbe {

    boolean hasData(UUID householdId);
}

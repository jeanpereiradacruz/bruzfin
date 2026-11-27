package com.bruzfin.api.shared.tenancy;

import java.util.Optional;

/**
 * Escopo de acesso da requisição atual, preenchido depois da autenticação e limpo ao final dela.
 * Fica disponível para todos os módulos e é aplicado no início de cada transação (SET LOCAL).
 */
public final class AccessScopeHolder {

    private static final ThreadLocal<AccessScope> CURRENT = new ThreadLocal<>();

    private AccessScopeHolder() {
    }

    public static Optional<AccessScope> current() {
        return Optional.ofNullable(CURRENT.get());
    }

    /** Escopo obrigatório: a requisição precisa vir de um usuário autenticado. */
    public static AccessScope require() {
        return current().orElseThrow(() -> new IllegalStateException("Requisição sem usuário autenticado"));
    }

    public static void set(AccessScope scope) {
        CURRENT.set(scope);
    }

    public static void clear() {
        CURRENT.remove();
    }
}

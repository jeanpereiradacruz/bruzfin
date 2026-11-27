package com.bruzfin.api.shared.tenancy;

/**
 * Nomes das configurações de sessão lidas pelas políticas de Row-Level Security (migração V3).
 * São sempre definidas com {@code set_config(nome, valor, true)}, que vale só até o fim da transação.
 */
public final class RowLevelSecurity {

    public static final String USER_SETTING = "app.user_id";
    public static final String HOUSEHOLD_SETTING = "app.household_id";
    public static final String INVITE_CODE_HASH_SETTING = "app.invite_code_hash";

    /** Define usuário e lar da transação; texto vazio apaga o valor anterior. */
    public static final String BIND_SQL = "select set_config('" + USER_SETTING + "', ?, true), set_config('"
            + HOUSEHOLD_SETTING + "', ?, true)";

    private RowLevelSecurity() {
    }

    public static String value(Object id) {
        return id == null ? "" : id.toString();
    }
}

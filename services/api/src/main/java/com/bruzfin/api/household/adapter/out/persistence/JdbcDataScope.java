package com.bruzfin.api.household.adapter.out.persistence;

import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.shared.tenancy.RowLevelSecurity;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.jdbc.core.simple.JdbcClient;

/** {@code set_config(..., true)} na conexão da transação atual: vale só até o commit ou rollback. */
@SecondaryAdapter
public final class JdbcDataScope implements DataScope {

    private final JdbcClient jdbc;

    public JdbcDataScope(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void bind(UUID userId, HouseholdId householdId) {
        jdbc.sql(RowLevelSecurity.BIND_SQL)
                .param(RowLevelSecurity.value(userId))
                .param(RowLevelSecurity.value(householdId == null ? null : householdId.value()))
                .query().listOfRows();
    }

    @Override
    public void allowInvite(String codeHash) {
        jdbc.sql("select set_config('" + RowLevelSecurity.INVITE_CODE_HASH_SETTING + "', ?, true)")
                .param(codeHash)
                .query().listOfRows();
    }
}

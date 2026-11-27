package com.bruzfin.api.platform.persistence;

import com.bruzfin.api.shared.tenancy.AccessScope;
import com.bruzfin.api.shared.tenancy.AccessScopeHolder;
import com.bruzfin.api.shared.tenancy.RowLevelSecurity;
import jakarta.persistence.EntityManagerFactory;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionSystemException;

/**
 * Gerenciador de transações que, ao abrir cada transação, informa ao PostgreSQL quem está agindo
 * ({@code SET LOCAL app.user_id / app.household_id}, a partir do {@link AccessScopeHolder}).
 * Assim a Row-Level Security filtra as linhas do lar em qualquer módulo, mesmo numa consulta sem filtro.
 * Sem escopo (tarefas internas, eventos), nada é definido e as tabelas do lar ficam invisíveis.
 */
public class RowLevelSecurityTransactionManager extends JpaTransactionManager {

    private static final long serialVersionUID = 1L;

    public RowLevelSecurityTransactionManager(EntityManagerFactory emf) {
        super(emf);
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        super.doBegin(transaction, definition);
        AccessScopeHolder.current().ifPresent(this::bind);
    }

    private void bind(AccessScope scope) {
        DataSource dataSource = getDataSource();
        if (dataSource == null) {
            throw new IllegalStateException("Transação JPA sem DataSource: não dá para aplicar a Row-Level Security");
        }
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try (PreparedStatement statement = connection.prepareStatement(RowLevelSecurity.BIND_SQL)) {
            statement.setString(1, RowLevelSecurity.value(scope.userId()));
            statement.setString(2, RowLevelSecurity.value(scope.householdId()));
            statement.execute();
        } catch (SQLException e) {
            throw new TransactionSystemException("Não foi possível aplicar a Row-Level Security", e);
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
    }
}

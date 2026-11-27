package com.bruzfin.api.household.adapter.out.persistence;

import com.bruzfin.api.household.application.port.out.InviteRepository;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Invite;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.jdbc.core.simple.JdbcClient;

@SecondaryAdapter
public final class JdbcInviteRepository implements InviteRepository {

    private final JdbcClient jdbc;

    public JdbcInviteRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void insert(Invite invite) {
        jdbc.sql("""
                        insert into household_invite (id, household_id, code_hash, created_by, created_at, expires_at)
                        values (?, ?, ?, ?, ?, ?)""")
                .params(invite.id(), invite.householdId().value(), invite.codeHash(), invite.createdBy(),
                        Timestamps.of(invite.createdAt()), Timestamps.of(invite.expiresAt()))
                .update();
    }

    @Override
    public void deletePending(HouseholdId householdId) {
        jdbc.sql("delete from household_invite where household_id = ? and used_at is null")
                .param(householdId.value())
                .update();
    }

    @Override
    public Optional<Invite> findByCodeHashForUpdate(String codeHash) {
        return jdbc.sql("""
                        select id, household_id, code_hash, created_by, created_at, expires_at, used_by, used_at
                        from household_invite where code_hash = ? for update""")
                .param(codeHash)
                .query(JdbcInviteRepository::invite)
                .optional();
    }

    @Override
    public void markUsed(Invite invite) {
        jdbc.sql("update household_invite set used_by = ?, used_at = ? where id = ? and used_at is null")
                .params(invite.usedBy(), Timestamps.of(invite.usedAt()), invite.id())
                .update();
    }

    private static Invite invite(ResultSet rs, int row) throws SQLException {
        return new Invite(rs.getObject("id", UUID.class), new HouseholdId(rs.getObject("household_id", UUID.class)),
                rs.getString("code_hash"), rs.getObject("created_by", UUID.class), Timestamps.read(rs, "created_at"),
                Timestamps.read(rs, "expires_at"), rs.getObject("used_by", UUID.class), Timestamps.read(rs, "used_at"));
    }
}

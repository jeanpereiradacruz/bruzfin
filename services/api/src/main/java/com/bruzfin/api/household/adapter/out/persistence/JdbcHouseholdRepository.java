package com.bruzfin.api.household.adapter.out.persistence;

import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.HouseholdName;
import com.bruzfin.api.household.domain.Member;
import com.bruzfin.api.household.domain.MemberRole;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.jdbc.core.simple.JdbcClient;

/** SQL sem filtro de lar de propósito onde a Row-Level Security já filtra (a política é a regra). */
@SecondaryAdapter
public final class JdbcHouseholdRepository implements HouseholdRepository {

    private final JdbcClient jdbc;

    public JdbcHouseholdRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void insert(Household household) {
        jdbc.sql("insert into household (id, name, created_at, updated_at) values (?, ?, ?, ?)")
                .params(household.id().value(), household.name().value(),
                        Timestamps.of(household.createdAt()), Timestamps.of(household.updatedAt()))
                .update();
    }

    @Override
    public Optional<Household> findById(HouseholdId id) {
        return jdbc.sql("select id, name, created_at, updated_at from household where id = ?")
                .param(id.value())
                .query(JdbcHouseholdRepository::household)
                .optional();
    }

    @Override
    public void rename(Household household) {
        jdbc.sql("update household set name = ?, updated_at = ? where id = ?")
                .params(household.name().value(), Timestamps.of(household.updatedAt()), household.id().value())
                .update();
    }

    @Override
    public void delete(HouseholdId id) {
        jdbc.sql("delete from household where id = ?").param(id.value()).update();
    }

    @Override
    public void insertMember(Member member) {
        jdbc.sql("insert into household_member (household_id, user_id, role, joined_at) values (?, ?, ?, ?)")
                .params(member.householdId().value(), member.userId(), member.role().name(),
                        Timestamps.of(member.joinedAt()))
                .update();
    }

    @Override
    public Optional<Member> findMembership(UUID userId) {
        return jdbc.sql("select household_id, user_id, role, joined_at from household_member where user_id = ?")
                .param(userId)
                .query(JdbcHouseholdRepository::member)
                .optional();
    }

    @Override
    public List<Member> members(HouseholdId id) {
        return jdbc.sql("""
                        select household_id, user_id, role, joined_at from household_member
                        where household_id = ? order by joined_at, user_id""")
                .param(id.value())
                .query(JdbcHouseholdRepository::member)
                .list();
    }

    private static Household household(ResultSet rs, int row) throws SQLException {
        return new Household(new HouseholdId(rs.getObject("id", UUID.class)), new HouseholdName(rs.getString("name")),
                Timestamps.read(rs, "created_at"), Timestamps.read(rs, "updated_at"));
    }

    private static Member member(ResultSet rs, int row) throws SQLException {
        return new Member(new HouseholdId(rs.getObject("household_id", UUID.class)),
                rs.getObject("user_id", UUID.class), MemberRole.valueOf(rs.getString("role")),
                Timestamps.read(rs, "joined_at"));
    }
}

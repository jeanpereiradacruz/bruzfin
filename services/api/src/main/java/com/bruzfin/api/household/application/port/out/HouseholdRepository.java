package com.bruzfin.api.household.application.port.out;

import com.bruzfin.api.household.domain.Household;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Member;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/** Lares e membros. Tudo passa pela Row-Level Security: o {@link DataScope} precisa estar definido. */
@SecondaryPort
public interface HouseholdRepository {

    void insert(Household household);

    Optional<Household> findById(HouseholdId id);

    void rename(Household household);

    /** Apaga o lar com membros e convites. */
    void delete(HouseholdId id);

    void insertMember(Member member);

    Optional<Member> findMembership(UUID userId);

    /** Membros por ordem de entrada. */
    List<Member> members(HouseholdId id);
}

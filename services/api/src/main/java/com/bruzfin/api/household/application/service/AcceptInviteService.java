package com.bruzfin.api.household.application.service;

import static com.bruzfin.api.household.domain.HouseholdException.Reason.ALREADY_MEMBER;
import static com.bruzfin.api.household.domain.HouseholdException.Reason.GUEST_HOUSEHOLD_NOT_EMPTY;
import static com.bruzfin.api.household.domain.HouseholdException.Reason.INVITE_ALREADY_USED;
import static com.bruzfin.api.household.domain.HouseholdException.Reason.INVITE_EXPIRED;
import static com.bruzfin.api.household.domain.HouseholdException.Reason.INVITE_NOT_FOUND;
import static com.bruzfin.api.household.domain.HouseholdException.Reason.TOO_MANY_ATTEMPTS;

import com.bruzfin.api.household.application.port.in.AcceptInviteUseCase;
import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.out.HouseholdData;
import com.bruzfin.api.household.application.port.out.InviteAttempts;
import com.bruzfin.api.household.application.port.out.InviteRepository;
import com.bruzfin.api.household.domain.HouseholdException;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.Invite;
import com.bruzfin.api.household.domain.InviteCode;
import com.bruzfin.api.household.domain.Member;
import com.bruzfin.api.household.domain.MemberRole;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.transaction.support.TransactionOperations;

public final class AcceptInviteService implements AcceptInviteUseCase {

    /** Erros que contam como tentativa errada (adivinhar códigos). */
    private static final Set<HouseholdException.Reason> WRONG_CODE =
            EnumSet.of(INVITE_NOT_FOUND, INVITE_EXPIRED, INVITE_ALREADY_USED);

    private final HouseholdAccess access;
    private final InviteRepository invites;
    private final InviteAttempts attempts;
    private final HouseholdData data;
    private final TransactionOperations transactions;
    private final Clock clock;

    AcceptInviteService(HouseholdAccess access, InviteRepository invites, InviteAttempts attempts,
            HouseholdData data, TransactionOperations transactions, Clock clock) {
        this.access = Objects.requireNonNull(access, "access");
        this.invites = Objects.requireNonNull(invites, "invites");
        this.attempts = Objects.requireNonNull(attempts, "attempts");
        this.data = Objects.requireNonNull(data, "data");
        this.transactions = Objects.requireNonNull(transactions, "transactions");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public HouseholdView accept(UUID userId, String rawCode) {
        Optional<Duration> blocked = attempts.blockedFor(userId);
        if (blocked.isPresent()) {
            throw new HouseholdException(TOO_MANY_ATTEMPTS, blocked.get());
        }
        try {
            InviteCode code = InviteCode.parse(rawCode).orElseThrow(() -> new HouseholdException(INVITE_NOT_FOUND));
            HouseholdView joined = transactions.execute(status -> join(userId, code));
            attempts.clear(userId);
            return joined;
        } catch (HouseholdException e) {
            if (WRONG_CODE.contains(e.reason())) {
                attempts.recordFailure(userId);
            }
            throw e;
        }
    }

    private HouseholdView join(UUID userId, InviteCode code) {
        Instant now = clock.instant();
        Optional<Member> current = access.membership(userId);
        access.scope().allowInvite(code.hash());
        Invite invite = invites.findByCodeHashForUpdate(code.hash())
                .orElseThrow(() -> new HouseholdException(INVITE_NOT_FOUND));
        if (current.isPresent() && current.get().householdId().equals(invite.householdId())) {
            throw new HouseholdException(ALREADY_MEMBER);
        }
        Invite redeemed = invite.redeem(userId, now);

        if (current.isPresent()) {
            discardAutomaticHousehold(current.get().householdId());
        }
        invites.markUsed(redeemed);
        access.scope().bind(userId, invite.householdId());
        access.households().insertMember(new Member(invite.householdId(), userId, MemberRole.MEMBER, now));
        return access.view(access.household(invite.householdId()), userId);
    }

    /** O lar automático só some se o convidado estiver sozinho nele e sem dados próprios. */
    private void discardAutomaticHousehold(HouseholdId householdId) {
        if (access.households().members(householdId).size() > 1 || data.hasData(householdId)) {
            throw new HouseholdException(GUEST_HOUSEHOLD_NOT_EMPTY);
        }
        access.households().delete(householdId);
    }
}

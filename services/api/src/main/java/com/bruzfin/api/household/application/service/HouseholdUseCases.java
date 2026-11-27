package com.bruzfin.api.household.application.service;

import com.bruzfin.api.household.application.port.in.AcceptInviteUseCase;
import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.InviteMemberUseCase;
import com.bruzfin.api.household.application.port.in.RenameHouseholdUseCase;
import com.bruzfin.api.household.application.port.out.DataScope;
import com.bruzfin.api.household.application.port.out.HouseholdData;
import com.bruzfin.api.household.application.port.out.HouseholdRepository;
import com.bruzfin.api.household.application.port.out.InviteAttempts;
import com.bruzfin.api.household.application.port.out.InviteRepository;
import com.bruzfin.api.household.application.port.out.MemberProfiles;
import java.time.Clock;
import java.util.random.RandomGenerator;
import org.springframework.transaction.support.TransactionOperations;

/** Monta os casos de uso do lar sobre as mesmas portas de saída. */
public final class HouseholdUseCases {

    private final GetHouseholdUseCase get;
    private final RenameHouseholdUseCase rename;
    private final InviteMemberUseCase invite;
    private final AcceptInviteUseCase accept;

    public HouseholdUseCases(HouseholdRepository households, InviteRepository invites, MemberProfiles profiles,
            DataScope scope, InviteAttempts attempts, HouseholdData data, RandomGenerator random,
            TransactionOperations transactions, Clock clock) {
        HouseholdAccess access = new HouseholdAccess(households, profiles, scope);
        this.get = new GetHouseholdService(access, transactions);
        this.rename = new RenameHouseholdService(access, transactions, clock);
        this.invite = new InviteMemberService(access, invites, random, transactions, clock);
        this.accept = new AcceptInviteService(access, invites, attempts, data, transactions, clock);
    }

    public GetHouseholdUseCase get() {
        return get;
    }

    public RenameHouseholdUseCase rename() {
        return rename;
    }

    public InviteMemberUseCase invite() {
        return invite;
    }

    public AcceptInviteUseCase accept() {
        return accept;
    }
}

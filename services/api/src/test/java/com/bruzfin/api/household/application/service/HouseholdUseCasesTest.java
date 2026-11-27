package com.bruzfin.api.household.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bruzfin.api.household.application.port.in.HouseholdView;
import com.bruzfin.api.household.application.port.in.IssuedInvite;
import com.bruzfin.api.household.domain.HouseholdException;
import com.bruzfin.api.household.domain.HouseholdException.Reason;
import com.bruzfin.api.household.domain.HouseholdId;
import com.bruzfin.api.household.domain.InviteCode;
import com.bruzfin.api.household.domain.MemberRole;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.UUID;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Casos de uso do lar")
class HouseholdUseCasesTest {

    private final InMemoryHousehold store = new InMemoryHousehold();
    private final HouseholdUseCases useCases = store.useCases();
    private final UUID owner = UUID.randomUUID();
    private final UUID guest = UUID.randomUUID();

    @BeforeEach
    void households() {
        store.create().createFor(owner, "Dona do Lar");
        store.create().createFor(guest, "Pessoa Convidada");
    }

    private HouseholdId householdOf(UUID user) {
        return store.members.get(user).householdId();
    }

    private static void assertReason(ThrowingCallable call, Reason reason) {
        assertThatThrownBy(call).isInstanceOfSatisfying(HouseholdException.class,
                e -> assertThat(e.reason()).isEqualTo(reason));
    }

    @Nested
    @DisplayName("ver e renomear")
    class ViewAndRename {

        @Test
        @DisplayName("mostra o lar com o papel do usuário e os membros")
        void view() {
            HouseholdView view = useCases.get().get(owner);

            assertThat(view.name()).isEqualTo("Lar de Dona");
            assertThat(view.role()).isEqualTo(MemberRole.OWNER);
            assertThat(view.members()).singleElement()
                    .satisfies(m -> assertThat(m.email()).isEqualTo(owner + "@bruzfin.local"));
        }

        @Test
        @DisplayName("sem lar ainda, avisa que está em preparação")
        void notReady() {
            assertReason(() -> useCases.get().get(UUID.randomUUID()), Reason.HOUSEHOLD_NOT_READY);
            assertThat(useCases.get().findMembership(UUID.randomUUID())).isEmpty();
        }

        @Test
        @DisplayName("troca o nome do lar")
        void rename() {
            HouseholdView view = useCases.rename().rename(owner, "  Casa  da praia ");

            assertThat(view.name()).isEqualTo("Casa da praia");
            assertThat(store.households.get(householdOf(owner)).name().value()).isEqualTo("Casa da praia");
        }

        @Test
        @DisplayName("recusa nome vazio")
        void rejectsBlankName() {
            assertReason(() -> useCases.rename().rename(owner, " "), Reason.INVALID_NAME);
        }
    }

    @Nested
    @DisplayName("convidar")
    class Invite {

        @Test
        @DisplayName("gera código de 48 horas e guarda só o hash")
        void issues() {
            IssuedInvite invite = useCases.invite().invite(owner);

            assertThat(invite.expiresAt()).isEqualTo(InMemoryHousehold.NOW.plus(Duration.ofHours(48)));
            String hash = InviteCode.parse(invite.code()).orElseThrow().hash();
            assertThat(store.invites).containsOnlyKeys(hash);
        }

        @Test
        @DisplayName("um código novo invalida o anterior ainda não usado")
        void replacesPendingInvite() {
            IssuedInvite first = useCases.invite().invite(owner);
            useCases.invite().invite(owner);

            assertThat(store.invites).hasSize(1);
            assertReason(() -> useCases.accept().accept(guest, first.code()), Reason.INVITE_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("aceitar convite")
    class Accept {

        @Test
        @DisplayName("convidado entra no lar e o lar automático vazio dele é descartado")
        void joins() {
            HouseholdId guestHousehold = householdOf(guest);
            String code = useCases.invite().invite(owner).code();

            HouseholdView view = useCases.accept().accept(guest, code.toLowerCase());

            assertThat(view.id()).isEqualTo(householdOf(owner));
            assertThat(view.role()).isEqualTo(MemberRole.MEMBER);
            assertThat(view.members()).extracting(HouseholdView.MemberView::userId).containsExactly(owner, guest);
            assertThat(store.households).doesNotContainKey(guestHousehold);
            assertThat(store.invites.values()).singleElement().satisfies(i -> {
                assertThat(i.usedBy()).isEqualTo(guest);
                assertThat(i.usedAt()).isEqualTo(InMemoryHousehold.NOW);
            });
        }

        @Test
        @DisplayName("só enxerga o convite pelo hash do código digitado")
        void scopesInviteLookup() {
            String code = useCases.invite().invite(owner).code();
            store.scopes.clear();

            useCases.accept().accept(guest, code);

            assertThat(store.scopes).contains("invite:" + InviteCode.parse(code).orElseThrow().hash());
            assertThat(store.scopes.getLast()).isEqualTo(guest + "@" + householdOf(owner).value());
        }

        @Test
        @DisplayName("código inexistente")
        void notFound() {
            assertReason(() -> useCases.accept().accept(guest, "ABCD-1230"), Reason.INVITE_NOT_FOUND);
            assertReason(() -> useCases.accept().accept(guest, "nada disso"), Reason.INVITE_NOT_FOUND);
        }

        @Test
        @DisplayName("convite vencido")
        void expired() {
            String code = useCases.invite().invite(owner).code();
            HouseholdUseCases later = store.useCasesAt(
                    Clock.fixed(InMemoryHousehold.NOW.plus(Duration.ofHours(48)), ZoneOffset.UTC));

            assertReason(() -> later.accept().accept(guest, code), Reason.INVITE_EXPIRED);
            assertThat(store.members.get(guest).householdId()).isNotEqualTo(householdOf(owner));
        }

        @Test
        @DisplayName("convite já usado")
        void alreadyUsed() {
            String code = useCases.invite().invite(owner).code();
            useCases.accept().accept(guest, code);
            UUID third = UUID.randomUUID();
            store.create().createFor(third, "Terceira Pessoa");

            assertReason(() -> useCases.accept().accept(third, code), Reason.INVITE_ALREADY_USED);
        }

        @Test
        @DisplayName("quem já é do lar não entra de novo")
        void alreadyMember() {
            String code = useCases.invite().invite(owner).code();

            assertReason(() -> useCases.accept().accept(owner, code), Reason.ALREADY_MEMBER);
        }

        @Test
        @DisplayName("convidado com outros membros no lar atual não pode trocar de lar")
        void guestHouseholdWithMembers() {
            String toGuestHousehold = useCases.invite().invite(guest).code();
            UUID third = UUID.randomUUID();
            store.create().createFor(third, "Terceira Pessoa");
            useCases.accept().accept(third, toGuestHousehold);
            String code = useCases.invite().invite(owner).code();

            assertReason(() -> useCases.accept().accept(guest, code), Reason.GUEST_HOUSEHOLD_NOT_EMPTY);
            assertThat(store.invites.get(InviteCode.parse(code).orElseThrow().hash()).isUsed()).isFalse();
        }

        @Test
        @DisplayName("convidado com dados próprios no lar atual não pode trocar de lar")
        void guestHouseholdWithData() {
            store.withData.add(householdOf(guest));
            String code = useCases.invite().invite(owner).code();

            assertReason(() -> useCases.accept().accept(guest, code), Reason.GUEST_HOUSEHOLD_NOT_EMPTY);
            assertThat(store.households).containsKey(householdOf(guest));
        }

        @Test
        @DisplayName("bloqueia depois de muitas tentativas erradas, mesmo com o código certo")
        void blocksAfterTooManyFailures() {
            String code = useCases.invite().invite(owner).code();
            for (int i = 0; i < store.maxFailures; i++) {
                assertReason(() -> useCases.accept().accept(guest, "ZZZZ-ZZZZ"), Reason.INVITE_NOT_FOUND);
            }

            assertThatThrownBy(() -> useCases.accept().accept(guest, code))
                    .isInstanceOfSatisfying(HouseholdException.class, e -> {
                        assertThat(e.reason()).isEqualTo(Reason.TOO_MANY_ATTEMPTS);
                        assertThat(e.retryAfter()).isEqualTo(Duration.ofMinutes(15));
                    });
        }

        @Test
        @DisplayName("acertar o código zera as tentativas erradas")
        void successClearsFailures() {
            assertReason(() -> useCases.accept().accept(guest, "ZZZZ-ZZZZ"), Reason.INVITE_NOT_FOUND);
            useCases.accept().accept(guest, useCases.invite().invite(owner).code());

            assertThat(store.failures).doesNotContainKey(guest);
        }

        @Test
        @DisplayName("já ser do lar não conta como tentativa errada")
        void alreadyMemberIsNotAFailure() {
            String code = useCases.invite().invite(owner).code();
            assertReason(() -> useCases.accept().accept(owner, code), Reason.ALREADY_MEMBER);

            assertThat(store.failures).doesNotContainKey(owner);
        }
    }
}

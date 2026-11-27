package com.bruzfin.api.household.adapter.in.web;

import com.bruzfin.api.household.application.port.in.AcceptInviteUseCase;
import com.bruzfin.api.household.application.port.in.GetHouseholdUseCase;
import com.bruzfin.api.household.application.port.in.InviteMemberUseCase;
import com.bruzfin.api.household.application.port.in.IssuedInvite;
import com.bruzfin.api.household.application.port.in.RenameHouseholdUseCase;
import com.bruzfin.api.shared.tenancy.AccessScopeHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@PrimaryAdapter
@RestController
@RequestMapping("/api/v1/household")
@Tag(name = "Lar", description = "Lar do usuário, membros e convites")
class HouseholdController {

    private static final String PROBLEM = "#/components/schemas/Problem";
    private static final String PROBLEM_JSON = "application/problem+json";

    private final GetHouseholdUseCase getHousehold;
    private final RenameHouseholdUseCase renameHousehold;
    private final InviteMemberUseCase inviteMember;
    private final AcceptInviteUseCase acceptInvite;

    HouseholdController(GetHouseholdUseCase getHousehold, RenameHouseholdUseCase renameHousehold,
            InviteMemberUseCase inviteMember, AcceptInviteUseCase acceptInvite) {
        this.getHousehold = getHousehold;
        this.renameHousehold = renameHousehold;
        this.inviteMember = inviteMember;
        this.acceptInvite = acceptInvite;
    }

    @GetMapping
    @Operation(operationId = "getHousehold", summary = "Lar do usuário com os membros")
    @ApiResponse(responseCode = "200", description = "Lar do usuário", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "409", description = "Lar automático ainda em preparação (household.household-not-ready)",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    HouseholdResponse get() {
        return HouseholdResponse.from(getHousehold.get(currentUser()));
    }

    @PatchMapping
    @Operation(operationId = "renameHousehold", summary = "Troca o nome do lar")
    @ApiResponse(responseCode = "200", description = "Lar com o nome novo", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "400", description = "Nome vazio ou com mais de 60 caracteres",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    @ApiResponse(responseCode = "409", description = "Lar automático ainda em preparação",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    HouseholdResponse rename(@Valid @RequestBody HouseholdRequests.Rename request) {
        return HouseholdResponse.from(renameHousehold.rename(currentUser(), request.name()));
    }

    @PostMapping("/invites")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(operationId = "createHouseholdInvite",
            summary = "Gera um código de convite (48 horas, uso único); o código anterior ainda não usado deixa de valer")
    @ApiResponse(responseCode = "201", description = "Código gerado; só aparece nesta resposta", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "409", description = "Lar automático ainda em preparação",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    HouseholdRequests.Invite invite() {
        IssuedInvite invite = inviteMember.invite(currentUser());
        return new HouseholdRequests.Invite(invite.code(), invite.expiresAt());
    }

    @PostMapping("/invites/accept")
    @Operation(operationId = "acceptHouseholdInvite", summary = "Entra no lar do código de convite")
    @ApiResponse(responseCode = "200", description = "Lar em que o usuário entrou", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "400", description = "Código ausente",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    @ApiResponse(responseCode = "404", description = "Código não encontrado (household.invite-not-found)",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    @ApiResponse(responseCode = "409", description = "Convite já usado, usuário já é do lar ou lar atual com dados",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    @ApiResponse(responseCode = "410", description = "Convite vencido (household.invite-expired)",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    @ApiResponse(responseCode = "503", description = "Não foi possível conferir as tentativas agora",
            content = @Content(mediaType = PROBLEM_JSON, schema = @Schema(ref = PROBLEM)))
    HouseholdResponse accept(@Valid @RequestBody HouseholdRequests.Accept request) {
        return HouseholdResponse.from(acceptInvite.accept(currentUser(), request.code()));
    }

    private static UUID currentUser() {
        return AccessScopeHolder.require().userId();
    }
}

package com.bruzfin.api.household.application.port.in;

import java.time.Instant;

/** Código recém-gerado, no formato {@code ABCD-EFGH}. Só existe nesta resposta: o banco guarda o hash. */
public record IssuedInvite(String code, Instant expiresAt) {

    @Override
    public String toString() {
        return "IssuedInvite[code=****, expiresAt=" + expiresAt + "]";
    }
}

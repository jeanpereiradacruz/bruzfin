package com.bruzfin.api.household.domain;

import java.time.Duration;
import java.util.Objects;

/** Regra do lar violada. A mensagem é segura para mostrar ao usuário (sem dados pessoais). */
public class HouseholdException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public enum Reason {
        HOUSEHOLD_NOT_READY("Seu lar ainda está sendo preparado. Tente de novo em instantes."),
        INVALID_NAME("O nome do lar precisa ter de 1 a 60 caracteres."),
        INVITE_NOT_FOUND("Código de convite não encontrado. Confira e tente de novo."),
        INVITE_EXPIRED("Este convite venceu. Peça um código novo."),
        INVITE_ALREADY_USED("Este convite já foi usado. Peça um código novo."),
        ALREADY_MEMBER("Você já faz parte deste lar."),
        GUEST_HOUSEHOLD_NOT_EMPTY("Você já tem dados ou outros membros no seu lar atual, então não dá para entrar em outro."),
        TOO_MANY_ATTEMPTS("Muitas tentativas com código errado. Aguarde e tente de novo."),
        ATTEMPTS_UNAVAILABLE("Não foi possível conferir o convite agora. Tente de novo em instantes.");

        private final String message;

        Reason(String message) {
            this.message = message;
        }

        public String message() {
            return message;
        }
    }

    private final Reason reason;
    private final Duration retryAfter;

    public HouseholdException(Reason reason) {
        this(reason, null);
    }

    public HouseholdException(Reason reason, Duration retryAfter) {
        super(Objects.requireNonNull(reason, "reason").message());
        this.reason = reason;
        this.retryAfter = retryAfter;
    }

    public Reason reason() {
        return reason;
    }

    /** Só em {@link Reason#TOO_MANY_ATTEMPTS}: quanto falta para poder tentar de novo. */
    public Duration retryAfter() {
        return retryAfter;
    }
}

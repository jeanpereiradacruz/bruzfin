package com.bruzfin.api.household.adapter.in.web;

import com.bruzfin.api.household.domain.HouseholdException;
import com.bruzfin.api.household.domain.HouseholdException.Reason;
import java.util.Locale;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Regras do lar violadas viram Problem Details com um {@code code} estável (ex.: {@code household.invite-expired})
 * para o app escolher a mensagem.
 */
@RestControllerAdvice(assignableTypes = HouseholdController.class)
class HouseholdProblems {

    @ExceptionHandler(HouseholdException.class)
    ResponseEntity<ProblemDetail> handle(HouseholdException e) {
        HttpStatus status = status(e.reason());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, e.reason().message());
        problem.setTitle(status.getReasonPhrase());
        problem.setProperty("code", code(e.reason()));
        ResponseEntity.BodyBuilder response = ResponseEntity.status(status);
        if (e.retryAfter() != null) {
            response.header(HttpHeaders.RETRY_AFTER, Long.toString(Math.max(1, e.retryAfter().toSeconds())));
        }
        return response.body(problem);
    }

    static String code(Reason reason) {
        return "household." + reason.name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    private static HttpStatus status(Reason reason) {
        return switch (reason) {
            case INVALID_NAME -> HttpStatus.BAD_REQUEST;
            case INVITE_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case INVITE_EXPIRED -> HttpStatus.GONE;
            case TOO_MANY_ATTEMPTS -> HttpStatus.TOO_MANY_REQUESTS;
            case ATTEMPTS_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            case HOUSEHOLD_NOT_READY, INVITE_ALREADY_USED, ALREADY_MEMBER, GUEST_HOUSEHOLD_NOT_EMPTY ->
                    HttpStatus.CONFLICT;
        };
    }
}

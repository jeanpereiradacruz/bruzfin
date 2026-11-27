package com.bruzfin.api.household.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("Código de convite")
class InviteCodeTest {

    @Test
    @DisplayName("gera 8 caracteres do alfabeto sem letras confusas, exibidos como ABCD-EFGH")
    void generatesReadableCodes() {
        InviteCode code = InviteCode.generate(new SecureRandom());

        assertThat(code.formatted()).matches("[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}");
    }

    @Test
    @DisplayName("códigos gerados não se repetem")
    void codesAreRandom() {
        SecureRandom random = new SecureRandom();
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            codes.add(InviteCode.generate(random).formatted());
        }
        assertThat(codes).hasSize(1_000);
    }

    @ParameterizedTest(name = "\"{0}\" é lido como ABCD-1230")
    @ValueSource(strings = {"ABCD-1230", "abcd1230", " abcd 1230 ", "ABCD-I23O", "abcd-l23o"})
    @DisplayName("ignora hífen, espaços e caixa e aceita O/I/L no lugar de 0/1")
    void parsesWhatTheUserTyped(String typed) {
        assertThat(InviteCode.parse(typed)).hasValueSatisfying(code -> {
            assertThat(code.formatted()).isEqualTo("ABCD-1230");
            assertThat(code.hash()).isEqualTo(InviteCode.parse("ABCD1230").orElseThrow().hash());
        });
    }

    @ParameterizedTest(name = "\"{0}\" não é um código")
    @ValueSource(strings = {"", "ABC-123", "ABCD-12345", "ABCD-123U", "ABCD-12#4"})
    @DisplayName("recusa o que não tem o formato de um código")
    void rejectsMalformedCodes(String typed) {
        assertThat(InviteCode.parse(typed)).isEmpty();
    }

    @Test
    @DisplayName("guarda só o SHA-256 e não aparece em logs")
    void hashesAndHides() {
        InviteCode code = InviteCode.parse("ABCD-1230").orElseThrow();

        assertThat(code.hash()).hasSize(64).matches("[0-9a-f]+").doesNotContain("ABCD");
        assertThat(code.toString()).doesNotContain("ABCD");
    }
}

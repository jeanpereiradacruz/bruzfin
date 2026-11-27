package com.bruzfin.api.household.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("Nome do lar")
class HouseholdNameTest {

    @Test
    @DisplayName("lar automático leva o primeiro nome do usuário")
    void defaultName() {
        assertThat(HouseholdName.defaultFor("Usuário de Teste").value()).isEqualTo("Lar de Usuário");
        assertThat(HouseholdName.defaultFor("  ana  ").value()).isEqualTo("Lar de ana");
        assertThat(HouseholdName.defaultFor("").value()).isEqualTo("Meu lar");
        assertThat(HouseholdName.defaultFor("x".repeat(80)).value()).hasSize(HouseholdName.MAX_LENGTH);
    }

    @Test
    @DisplayName("tira espaços sobrando")
    void normalizes() {
        assertThat(new HouseholdName("  Casa   da   praia ").value()).isEqualTo("Casa da praia");
    }

    @ParameterizedTest(name = "\"{0}\" é recusado")
    @ValueSource(strings = {"", "   "})
    @DisplayName("não aceita nome vazio")
    void rejectsBlank(String name) {
        assertThatThrownBy(() -> new HouseholdName(name)).isInstanceOf(InvalidHouseholdNameException.class);
    }

    @Test
    @DisplayName("não aceita mais de 60 caracteres")
    void rejectsTooLong() {
        assertThatThrownBy(() -> new HouseholdName("a".repeat(61))).isInstanceOf(InvalidHouseholdNameException.class);
    }
}

package com.bruzfin.api.architecture;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

@DisplayName("Arquitetura hexagonal")
class HexagonalArchitectureTest {

    private static final JavaClasses PRODUCTION_CLASSES = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.bruzfin.api");

    /** Exemplo com uma violação de cada regra, em src/test (com.bruzfin.archfixture). */
    private static final JavaClasses FIXTURE_WITH_VIOLATIONS = new ClassFileImporter()
            .importPackages("com.bruzfin.archfixture");

    static Stream<ArchRule> rules() {
        return Stream.of(
                HexagonalArchitectureRules.DOMAIN_IS_PURE,
                HexagonalArchitectureRules.APPLICATION_DOES_NOT_DEPEND_ON_ADAPTERS,
                HexagonalArchitectureRules.APPLICATION_IS_FRAMEWORK_FREE,
                HexagonalArchitectureRules.INBOUND_ADAPTERS_DO_NOT_USE_OUTBOUND_ADAPTERS,
                HexagonalArchitectureRules.OUTBOUND_ADAPTERS_DO_NOT_USE_INBOUND_ADAPTERS,
                HexagonalArchitectureRules.CONTROLLERS_LIVE_IN_WEB_ADAPTERS,
                HexagonalArchitectureRules.ENTITIES_LIVE_IN_PERSISTENCE_ADAPTERS);
    }

    @ParameterizedTest(name = "código da API respeita: {0}")
    @MethodSource("rules")
    void productionCodeFollowsRule(ArchRule rule) {
        rule.allowEmptyShould(true).check(PRODUCTION_CLASSES);
    }

    @ParameterizedTest(name = "regra detecta violação: {0}")
    @MethodSource("rules")
    void ruleDetectsViolations(ArchRule rule) {
        assertThatThrownBy(() -> rule.check(FIXTURE_WITH_VIOLATIONS)).isInstanceOf(AssertionError.class);
    }
}

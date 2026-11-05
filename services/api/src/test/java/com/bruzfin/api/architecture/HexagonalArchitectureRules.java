package com.bruzfin.api.architecture;

import static com.tngtech.archunit.base.DescribedPredicate.not;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.lang.ArchRule;

/**
 * Regras da arquitetura hexagonal, válidas para todos os módulos.
 * Ficam separadas do teste para também serem aplicadas sobre um exemplo com violações
 * (prova de que as regras realmente pegam erros).
 */
final class HexagonalArchitectureRules {

    private HexagonalArchitectureRules() {
    }

    static final ArchRule DOMAIN_IS_PURE = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..",
                    "jakarta..",
                    "org.hibernate..",
                    "tools.jackson..",
                    "com.fasterxml.jackson..",
                    "..application..",
                    "..adapter..")
            .as("O domínio não depende de framework, da aplicação nem de adapters");

    static final ArchRule APPLICATION_DOES_NOT_DEPEND_ON_ADAPTERS = noClasses()
            .that().resideInAPackage("..application..")
            .should().dependOnClassesThat().resideInAPackage("..adapter..")
            .as("A camada de aplicação não depende de adapters");

    static final ArchRule APPLICATION_IS_FRAMEWORK_FREE = noClasses()
            .that().resideInAPackage("..application..")
            .should().dependOnClassesThat(
                    resideInAnyPackage("org.springframework..", "jakarta.persistence..", "org.hibernate..")
                            .and(not(resideInAPackage("org.springframework.transaction.."))))
            .as("A aplicação só pode usar do Spring o controle de transação");

    static final ArchRule INBOUND_ADAPTERS_DO_NOT_USE_OUTBOUND_ADAPTERS = noClasses()
            .that().resideInAPackage("..adapter.in..")
            .should().dependOnClassesThat().resideInAPackage("..adapter.out..")
            .as("Adapters de entrada falam com casos de uso, nunca com adapters de saída");

    static final ArchRule OUTBOUND_ADAPTERS_DO_NOT_USE_INBOUND_ADAPTERS = noClasses()
            .that().resideInAPackage("..adapter.out..")
            .should().dependOnClassesThat().resideInAPackage("..adapter.in..")
            .as("Adapters de saída não dependem de adapters de entrada");

    static final ArchRule CONTROLLERS_LIVE_IN_WEB_ADAPTERS = classes()
            .that().areAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .should().resideInAPackage("..adapter.in.web..")
            .as("Controllers REST ficam em adapter.in.web");

    static final ArchRule ENTITIES_LIVE_IN_PERSISTENCE_ADAPTERS = classes()
            .that().areAnnotatedWith("jakarta.persistence.Entity")
            .should().resideInAPackage("..adapter.out.persistence..")
            .as("Entidades JPA ficam em adapter.out.persistence (o domínio não é entidade JPA)");
}

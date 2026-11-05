package com.bruzfin.api.about.domain;

import java.util.Objects;
import org.jmolecules.ddd.annotation.ValueObject;

/** Identificação da API exposta aos clientes (app e web). */
@ValueObject
public record AboutInfo(String name, String version) {

    public static final String UNKNOWN_VERSION = "desconhecida";

    public AboutInfo {
        Objects.requireNonNull(name, "name");
        Objects.requireNonNull(version, "version");
        if (name.isBlank()) {
            throw new IllegalArgumentException("O nome da API não pode ser vazio");
        }
        if (version.isBlank()) {
            version = UNKNOWN_VERSION;
        }
    }
}

package com.bruzfin.api.household.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.random.RandomGenerator;
import org.jmolecules.ddd.annotation.ValueObject;

/**
 * Código de convite: 8 caracteres do alfabeto Crockford Base32 (sem I, L, O e U, que confundem),
 * cerca de 10^12 combinações, exibido como {@code ABCD-EFGH}. Só o hash SHA-256 é guardado.
 */
@ValueObject
public final class InviteCode {

    static final String ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    static final int LENGTH = 8;

    private final String value;

    private InviteCode(String value) {
        this.value = value;
    }

    /** Gera um código novo; use um gerador criptográfico ({@code SecureRandom}). */
    public static InviteCode generate(RandomGenerator random) {
        StringBuilder code = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return new InviteCode(code.toString());
    }

    /**
     * Lê o que o usuário digitou: ignora hífens, espaços e maiúsculas/minúsculas e aceita
     * O no lugar de 0 e I/L no lugar de 1. Vazio se não tiver o formato de um código.
     */
    public static Optional<InviteCode> parse(String input) {
        if (input == null) {
            return Optional.empty();
        }
        String normalized = input.toUpperCase(Locale.ROOT)
                .replaceAll("[\\s-]", "")
                .replace('O', '0')
                .replace('I', '1')
                .replace('L', '1');
        if (normalized.length() != LENGTH || !normalized.chars().allMatch(c -> ALPHABET.indexOf(c) >= 0)) {
            return Optional.empty();
        }
        return Optional.of(new InviteCode(normalized));
    }

    /** Como o código aparece para o usuário: {@code ABCD-EFGH}. */
    public String formatted() {
        return value.substring(0, LENGTH / 2) + "-" + value.substring(LENGTH / 2);
    }

    /** SHA-256 em hexadecimal: é o que fica no banco. */
    public String hash() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof InviteCode code && code.value.equals(value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    /** Nunca expõe o código em logs. */
    @Override
    public String toString() {
        return "InviteCode[****]";
    }
}

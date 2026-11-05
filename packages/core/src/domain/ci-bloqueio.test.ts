import { describe, expect, it } from "vitest";

// Teste falhando de propósito: prova que o CI bloqueia o merge (KAN-20). Não mergear.
describe("CI", () => {
  it("bloqueia PR com teste falhando", () => {
    expect(1 + 1).toBe(3);
  });
});

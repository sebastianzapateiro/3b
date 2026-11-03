import { describe, expect, it } from "vitest";
import { nivelDePerfil } from "./nivel";

describe("nivelDePerfil", () => {
  it("sube de nivel con la completitud", () => {
    expect(nivelDePerfil(0)).toBe("verificado");
    expect(nivelDePerfil(49)).toBe("verificado");
    expect(nivelDePerfil(50)).toBe("completo");
    expect(nivelDePerfil(99)).toBe("completo");
    expect(nivelDePerfil(100)).toBe("destacado");
  });
});

/** B1 · El catálogo de /admin/correos: cada entrada se arma y su asunto real la reconoce el historial. */
import { describe, expect, it } from "vitest";
import { CATALOGO_CORREOS, entradaPorAsunto } from "./correos-catalogo";

describe("catálogo de correos", () => {
  it("ids únicos", () => {
    expect(new Set(CATALOGO_CORREOS.map((c) => c.id)).size).toBe(CATALOGO_CORREOS.length);
  });
  it.each(CATALOGO_CORREOS.map((c) => [c.id, c] as const))("%s: se arma y se reconoce por su asunto", (_id, c) => {
    const v = c.vista();
    expect(v.asunto.length).toBeGreaterThan(5);
    expect(v.texto.length).toBeGreaterThan(20);
    expect(entradaPorAsunto(v.asunto)?.id).toBe(c.id);
  });
});

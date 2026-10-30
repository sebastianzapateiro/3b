import { describe, expect, it } from "vitest";
import { CODIGO_VALIDO, enlaceCalificar, generarCodigo, mensajeCalificacion } from "@/lib/calificacion";

describe("código de servicio", () => {
  it("tiene 6 caracteres legibles (sin 0, O, 1, I ni L)", () => {
    for (let i = 0; i < 200; i++) expect(generarCodigo()).toMatch(CODIGO_VALIDO);
  });

  it("es determinista con un generador fijo", () => {
    expect(generarCodigo(6, () => 0)).toBe("AAAAAA");
  });

  it("rechaza códigos con caracteres confusos o de otro largo", () => {
    expect(CODIGO_VALIDO.test("A7K2Q9")).toBe(true);
    expect(CODIGO_VALIDO.test("A7K2Q0")).toBe(false);
    expect(CODIGO_VALIDO.test("A7K2")).toBe(false);
  });
});

describe("invitación a calificar", () => {
  it("arma el enlace con el código", () => {
    expect(enlaceCalificar("https://lastresb.com.co/", "don-jorge-plomeria", "A7K2Q9")).toBe("https://lastresb.com.co/don-jorge-plomeria/calificar?codigo=A7K2Q9");
  });

  it("nombra al cliente y al proveedor e incluye el enlace", () => {
    const m = mensajeCalificacion({ cliente: "Marcela", proveedor: "Don Jorge", enlace: "https://x.co/c" });
    expect(m).toContain("Hola Marcela");
    expect(m).toContain("Don Jorge");
    expect(m).toContain("https://x.co/c");
  });

  it("funciona sin nombre del cliente", () => {
    expect(mensajeCalificacion({ cliente: null, proveedor: "Don Jorge", enlace: "u" })).toMatch(/^Hola, te escribimos/);
  });
});

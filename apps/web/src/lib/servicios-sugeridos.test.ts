import { describe, expect, it } from "vitest";
import { rutaProveedor, sugerirSlug, TODAS_LAS_SUBCATEGORIAS, serviciosSugeridos } from "@las3b/shared";

describe("servicios sugeridos por oficio (menú al crear servicios)", () => {
  it("Aseo y limpieza ofrece sus servicios típicos", () => {
    const aseo = serviciosSugeridos("aseo");
    expect(aseo).toContain("Limpieza profunda");
    expect(aseo.length).toBeGreaterThan(1);
  });

  it("un oficio desconocido no rompe: lista vacía (queda «Otro servicio»)", () => {
    expect(serviciosSugeridos("no-existe")).toEqual([]);
  });

  it("todos los oficios del catálogo traen al menos un servicio sugerido", () => {
    const sin = TODAS_LAS_SUBCATEGORIAS.filter(({ sub }) => serviciosSugeridos(sub.slug).length === 0).map(({ sub }) => sub.slug);
    expect(sin, `oficios sin servicios sugeridos: ${sin.join(", ")}`).toEqual([]);
  });
});

describe("dirección del proveedor: el nombre; la URL pública agrega el oficio (/nombre/oficio)", () => {
  it("el slug sale del nombre, sin tildes ni símbolos", () => {
    expect(sugerirSlug("Clemencia Rojas")).toBe("clemencia-rojas");
    expect(sugerirSlug("Ñoño & Hijos")).toBe("nono-hijos");
  });

  it("la URL pública es /nombre/oficio", () => {
    expect(rutaProveedor("clemencia-rojas", "Aseo y limpieza")).toBe("/clemencia-rojas/aseo-y-limpieza");
    expect(rutaProveedor("clemencia-rojas")).toBe("/clemencia-rojas");
  });
});
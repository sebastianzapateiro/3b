import { describe, expect, it } from "vitest";
import { CATEGORIAS, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { construirMosaico, etiquetaAccesible, TEMAS, VELO } from "./mosaico";

const luz = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [luz(a), luz(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** Color tras el velo oscuro a la altura donde empieza el texto. */
const conVelo = (hex: string) => {
  const k = 1 - VELO.opacidadTexto;
  const canal = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0");
  return `#${canal(1)}${canal(3)}${canal(5)}`;
};

describe("mosaico de categorías", () => {
  const tiles = construirMosaico(CATEGORIAS);

  it("parte Hogar en sus 4 subgrupos y conserva el resto de categorías", () => {
    expect(tiles.filter((t) => t.etiqueta === "Hogar").map((t) => [t.nombre, t.total])).toEqual([
      ["Reparaciones", 9],
      ["Obra y acabados", 7],
      ["Instalaciones", 7],
      ["Limpieza y jardín", 3],
    ]);
    expect(tiles).toHaveLength(CATEGORIAS.length - 1 + 4);
  });

  it("no pierde ni inventa oficios", () => {
    expect(tiles.reduce((n, t) => n + t.total, 0)).toBe(TODAS_LAS_SUBCATEGORIAS.length);
  });

  it("muestra los 3 primeros oficios en el orden de la taxonomía", () => {
    const rep = tiles.find((t) => t.nombre === "Reparaciones")!;
    expect(rep.oficios).toEqual(["Plomería", "Electricidad", "Gas"]);
  });

  it("los tiles llevan a los resultados de /proveedores con el filtro aplicado", () => {
    expect(tiles.find((t) => t.nombre === "Obra y acabados")!.href).toMatch(/^\/proveedores\?categoria=[a-z0-9-]+(,[a-z0-9-]+)+$/);
    expect(tiles.find((t) => t.nombre === "Acarreos y transporte")!.href).toBe("/proveedores?categoria=acarreos-y-transporte");
  });

  it("describe cada tile para lectores de pantalla", () => {
    expect(etiquetaAccesible({ etiqueta: "Hogar", nombre: "Reparaciones", total: 9 })).toBe("Hogar · Reparaciones, 9 oficios");
  });

  it("todo tile tiene tema propio", () => {
    for (const t of tiles) expect(TEMAS[t.clave], t.clave).toBeDefined();
  });

  it("cumple contraste AA: texto blanco sobre el velo y la píldora sobre blanco", () => {
    for (const [clave, t] of Object.entries(TEMAS)) {
      if (t.textoSinFoto === "blanco") {
        expect(contraste("#FFFFFF", conVelo(t.desde)), `${clave} inicio`).toBeGreaterThanOrEqual(4.5);
        expect(contraste("#FFFFFF", conVelo(t.hasta)), `${clave} fin`).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(contraste("#1B2623", t.desde), `${clave} inicio`).toBeGreaterThanOrEqual(4.5);
        expect(contraste("#1B2623", t.hasta), `${clave} fin`).toBeGreaterThanOrEqual(4.5);
      }
      if (t.foto) expect(contraste("#FFFFFF", conVelo("#FFFFFF")), `${clave} foto (peor caso: píxel blanco)`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.pildora, "#FFFFFF"), `${clave} píldora`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

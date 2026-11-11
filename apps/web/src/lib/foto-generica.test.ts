import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@las3b/shared";
import { fotoGenericaPara } from "@/lib/foto-generica";

const nombre = (slug: string) => CATEGORIAS.flatMap((c) => c.subcategorias).find((s) => s.slug === slug)!.nombre;

describe("foto genérica por oficio", () => {
  it("elige la silueta según el oficio", () => {
    expect(fotoGenericaPara([nombre("electricista")])).toBe("/perfiles/electricidad.webp");
    expect(fotoGenericaPara([nombre("trasteos")])).toBe("/perfiles/transporte.webp");
    expect(fotoGenericaPara([nombre("aseo")])).toBe("/perfiles/aseo.webp");
    expect(fotoGenericaPara([nombre("plomero")])).toBe("/perfiles/obra.webp");
  });
  it("con varios oficios gana el de mayor prioridad", () => {
    expect(fotoGenericaPara([nombre("plomero"), nombre("electricista")])).toBe("/perfiles/electricidad.webp");
  });
  it("sin silueta para el oficio devuelve null (se usan las iniciales)", () => {
    expect(fotoGenericaPara([nombre("profesor-de-ingles")])).toBeNull();
    expect(fotoGenericaPara([])).toBeNull();
  });
});

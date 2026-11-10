import { describe, expect, it } from "vitest";
import { esFichaIndexable } from "@/lib/indexacion";

const completa = {
  estado: "aprobado",
  categorias: ["Plomería"],
  localidades: ["Suba"],
  servicios: [{ nombre: "Fugas", descripcion: null, precioDesde: null, unidad: "visita" }],
  fotoPerfil: "https://x/foto.jpg",
  fotos: [],
};

describe("esFichaIndexable (SEO)", () => {
  it("indexa un proveedor aprobado con perfil completo", () => {
    expect(esFichaIndexable(completa)).toBe(true);
  });

  it("acepta fotos de trabajos en lugar de foto de perfil", () => {
    expect(esFichaIndexable({ ...completa, fotoPerfil: null, fotos: [{ id: "1", ruta: "a", rutaMiniatura: null, descripcion: null }] })).toBe(true);
  });

  it("no indexa a quien está en revisión, pausado o en borrador", () => {
    for (const estado of ["en_revision", "pausado", "borrador", "rechazado", "suspendido"]) expect(esFichaIndexable({ ...completa, estado })).toBe(false);
  });

  it("no indexa perfiles incompletos: sin oficio, localidad, servicio o foto", () => {
    expect(esFichaIndexable({ ...completa, categorias: [] })).toBe(false);
    expect(esFichaIndexable({ ...completa, localidades: [] })).toBe(false);
    expect(esFichaIndexable({ ...completa, servicios: [] })).toBe(false);
    expect(esFichaIndexable({ ...completa, fotoPerfil: null, fotos: [] })).toBe(false);
  });
});

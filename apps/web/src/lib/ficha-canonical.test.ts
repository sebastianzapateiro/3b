/**
 * Opción A (10 nov 2026): una ficha indexable por proveedor. Pruebas con DATOS DE PRUEBA (sin base de datos): comprueban la regla de
 * canonical y de sitemap para proveedores con varios oficios. No prueban las páginas reales ni cómo las trata Google.
 */
import { describe, expect, it } from "vitest";
import { rutaPrincipalProveedor, rutaProveedor, segmentoOficio } from "@las3b/shared";
import { metadatosFicha, rutaPrincipalDe } from "@/lib/ficha-seo";
import type { PortafolioCompleto } from "@/lib/portafolio-completo";
import { SITIO_URL } from "@/lib/seo";
import { construirSitemap, type DatosSitemap } from "@/lib/sitemap-construir";

const OFICIOS = ["Plomería", "Electricidad", "Aseo y limpieza"]; // alfabético por segmento: aseo-y-limpieza, electricidad, plomeria
const vacio: DatosSitemap = { proveedores: [], localidades: [], oficios: [], combinaciones: [], minimo: 3 };

const ficha = (extra: Partial<PortafolioCompleto> = {}) =>
  ({
    slug: "ana-gomez",
    estado: "aprobado",
    esEmpresa: false,
    actualizado: new Date("2026-11-01"),
    nombre: "Ana Gómez",
    presentacion: "Técnica con diez años de experiencia en reparaciones del hogar.",
    categorias: OFICIOS,
    localidades: ["Suba", "Usaquén"],
    servicios: [{ nombre: "Fugas", descripcion: null, precioDesde: null, unidad: "visita" }],
    fotoPerfil: "https://x/foto.jpg",
    fotos: [],
    ...extra,
  }) as unknown as PortafolioCompleto;

describe("URL principal del proveedor", () => {
  it("es la del primer oficio alfabético, sin importar el orden en que lleguen los oficios", () => {
    const esperado = "/ana-gomez/aseo-y-limpieza";
    expect(rutaPrincipalProveedor("ana-gomez", OFICIOS)).toBe(esperado);
    expect(rutaPrincipalProveedor("ana-gomez", [...OFICIOS].reverse())).toBe(esperado);
    expect(rutaPrincipalProveedor("ana-gomez", [OFICIOS[1]!, OFICIOS[2]!, OFICIOS[0]!])).toBe(esperado);
  });

  it("con un solo oficio es esa URL; sin oficios, /nombre", () => {
    expect(rutaPrincipalProveedor("ana-gomez", ["Plomería"])).toBe("/ana-gomez/plomeria");
    expect(rutaPrincipalProveedor("ana-gomez", [])).toBe("/ana-gomez");
  });

  it("no cambia los slugs ni el modelo /nombre/oficio de las URLs secundarias", () => {
    for (const o of OFICIOS) expect(rutaProveedor("ana-gomez", o)).toBe(`/ana-gomez/${segmentoOficio(o)}`);
  });
});

describe("canonical de la ficha: todas las URLs del proveedor apuntan a la principal", () => {
  it("la canonical y la URL de Open Graph son la principal, también al entrar por otro oficio", () => {
    const m = metadatosFicha(ficha());
    expect(m.alternates?.canonical).toBe("/ana-gomez/aseo-y-limpieza");
    expect((m.openGraph as { url?: string }).url).toBe("/ana-gomez/aseo-y-limpieza");
    expect(rutaPrincipalDe(ficha())).toBe("/ana-gomez/aseo-y-limpieza");
  });

  it("la ficha indexable no lleva noindex (las URLs secundarias tampoco: se resuelven con la canonical)", () => {
    expect(metadatosFicha(ficha()).robots).toBeUndefined();
  });

  it("la ficha no indexable lleva noindex y conserva la canonical a la principal", () => {
    for (const mala of [ficha({ estado: "en_revision" }), ficha({ fotoPerfil: null, fotos: [] }), ficha({ servicios: [] })]) {
      const m = metadatosFicha(mala);
      expect(m.robots).toEqual({ index: false, follow: true });
      expect(m.alternates?.canonical).toBe("/ana-gomez/aseo-y-limpieza");
    }
  });

  it("el título y la descripción son los mismos para todas las URLs del proveedor", () => {
    expect(JSON.stringify(metadatosFicha(ficha()))).toBe(JSON.stringify(metadatosFicha(ficha())));
  });
});

describe("sitemap: un proveedor aparece una sola vez", () => {
  const fecha = "2026-11-01T10:00:00.000Z";

  it("con tres oficios entra solo la URL principal y ninguna secundaria", () => {
    const urls = construirSitemap({ ...vacio, proveedores: [{ slug: "ana-gomez", actualizado: fecha, oficios: OFICIOS }] }).map((e) => e.url);
    expect(urls.filter((u) => u.includes("/ana-gomez"))).toEqual([`${SITIO_URL}/ana-gomez/aseo-y-limpieza`]);
  });

  it("conserva la fecha real de modificación y no repite al proveedor aunque llegue duplicado el oficio", () => {
    const e = construirSitemap({ ...vacio, proveedores: [{ slug: "ana-gomez", actualizado: fecha, oficios: ["Plomería", "Plomería"] }] }).filter((x) => x.url.includes("/ana-gomez"));
    expect(e).toHaveLength(1);
    expect(e[0]!.lastModified).toBe(fecha);
  });

  it("cada proveedor aporta exactamente una URL y todas son distintas", () => {
    const proveedores = ["a", "b", "c"].map((s) => ({ slug: `prov-${s}`, actualizado: fecha, oficios: OFICIOS }));
    const urls = construirSitemap({ ...vacio, proveedores }).map((e) => e.url).filter((u) => u.includes("/prov-"));
    expect(urls).toHaveLength(3);
    expect(new Set(urls).size).toBe(3);
  });

  it("la URL del sitemap coincide con la canonical de la ficha (nunca se lista una URL que declara otra canonical)", () => {
    const p = ficha();
    const enSitemap = construirSitemap({ ...vacio, proveedores: [{ slug: p.slug, actualizado: fecha, oficios: p.categorias }] }).map((e) => e.url);
    expect(enSitemap).toContain(`${SITIO_URL}${metadatosFicha(p).alternates?.canonical}`);
  });
});

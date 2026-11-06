import { describe, expect, it } from "vitest";
import { CATEGORIAS, TODAS_LAS_SUBCATEGORIAS, contieneServicioProhibido, subcategoriaPorSlug } from "@las3b/shared";
import { descripcion, h1, titulo } from "@/lib/seo-servicios";
import { GUIAS } from "@/lib/guias";

/** Guardia del SEO por oficio: cualquier oficio nuevo o renombrado debe cumplir lo mismo que los demás. */
describe("SEO de las páginas por oficio", () => {
  const oficios = TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => sub);

  it("títulos de máximo 60 caracteres, con la marca y sin repetirse entre oficios", () => {
    const vistos = new Map<string, string>();
    for (const sub of oficios) {
      const t = titulo(sub, "base");
      expect(t.length, `${sub.slug}: «${t}»`).toBeLessThanOrEqual(60);
      expect(t).toContain("LasTresB");
      expect(vistos.get(t), `título repetido entre ${sub.slug} y ${vistos.get(t)}`).toBeUndefined();
      vistos.set(t, sub.slug);
    }
  });

  it("descripciones de 120 a 155 caracteres, sin repetirse", () => {
    const vistas = new Set<string>();
    for (const sub of oficios) {
      const d = descripcion(sub, "base");
      expect(d.length, `${sub.slug}: ${d.length}`).toBeGreaterThanOrEqual(120);
      expect(d.length, `${sub.slug}: ${d.length}`).toBeLessThanOrEqual(155);
      expect(vistas.has(d), `descripción repetida en ${sub.slug}`).toBe(false);
      vistas.add(d);
    }
  });

  it("cada oficio trae palabra principal con «en Bogotá», introducción y búsquedas relacionadas", () => {
    for (const sub of oficios) {
      expect(sub.seo.principal, sub.slug).toMatch(/ en Bogotá$/i);
      expect(sub.seo.intro.length, `${sub.slug}: introducción`).toBeGreaterThan(60);
    }
    const pocas = oficios.filter((s) => s.seo.relacionadas.length < 3).map((s) => `${s.slug} (${s.seo.relacionadas.length})`);
    expect(pocas, `oficios con menos de 3 búsquedas relacionadas: ${pocas.join(", ")}`).toEqual([]);
  });

  it("el H1 de cada oficio lleva su palabra principal", () => {
    for (const sub of oficios) expect(h1(sub, "base").toLowerCase()).toContain(sub.seo.principal.toLowerCase().replace(/ en bogotá$/i, ""));
  });

  it("slugs de oficios y de categorías únicos", () => {
    const slugs = [...oficios.map((s) => s.slug), ...CATEGORIAS.map((c) => c.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ningún texto SEO menciona servicios que LasTresB no ofrece (regla de negocio)", () => {
    for (const sub of oficios) {
      const texto = [sub.nombre, sub.seo.principal, sub.seo.intro, ...sub.seo.relacionadas, ...sub.seo.problemas].join(" · ");
      // Veterinaria y fisioterapia son las excepciones decididas el 4 de nov: llevan su aviso reforzado.
      if (sub.avisoSalud) continue;
      expect(contieneServicioProhibido(texto), `${sub.slug}: ${texto}`).toBe(false);
    }
  });

  it("las guías enlazan a una categoría que existe y no repiten slug", () => {
    expect(new Set(GUIAS.map((g) => g.slug)).size).toBe(GUIAS.length);
    for (const g of GUIAS) if (g.categoria) expect(CATEGORIAS.some((c) => c.slug === g.categoria), `${g.slug}: categoría ${g.categoria}`).toBe(true);
  });

  it("los oficios renombrados conservan su slug", () => {
    expect(subcategoriaPorSlug("cortinas-y-persianas")?.sub.nombre).toBe("Instalación de cortinas");
    expect(subcategoriaPorSlug("mallas-de-seguridad")?.sub.nombre).toBe("Instalación de mallas para balcón");
  });
});

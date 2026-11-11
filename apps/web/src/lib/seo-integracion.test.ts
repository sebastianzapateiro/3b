/**
 * Pruebas de integración del SEO (10 nov 2026) con DATOS DE PRUEBA: no hay base de datos real aquí. Comprueban cómo se arman juntos
 * el sitemap, robots.txt, los metadatos, el schema, los enlaces y los ALT. NO prueban las consultas SQL (FICHA_INDEXABLE_SQL), que quedan
 * por validar contra la base, ni cómo recibe Google las páginas.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIAS, LOCALIDADES_BOGOTA, TODAS_LAS_SUBCATEGORIAS, categoriaPorSlug, rutaProveedor, subcategoriaPorSlug } from "@las3b/shared";
import { altFotoTrabajo } from "@/lib/alt-imagenes";
import { construirMosaico } from "@/lib/mosaico";
import { jsonLdProveedor, meta, SITIO_URL } from "@/lib/seo";
import { construirSitemap, paginasFijas, type DatosSitemap } from "@/lib/sitemap-construir";

const conUrgencias = TODAS_LAS_SUBCATEGORIAS.find(({ sub }) => sub.atiendeUrgencias)!.sub;
const sinUrgencias = TODAS_LAS_SUBCATEGORIAS.find(({ sub }) => !sub.atiendeUrgencias)!.sub;
const localidad = LOCALIDADES_BOGOTA[0]!.slug;
const otraLocalidad = LOCALIDADES_BOGOTA[1]!.slug;

const vacio: DatosSitemap = { proveedores: [], localidades: [], oficios: [], combinaciones: [], minimo: 3 };
const urls = (d: Partial<DatosSitemap>) => construirSitemap({ ...vacio, ...d }).map((e) => e.url);
const ruta = (r: string) => `${SITIO_URL}${r}`;

describe("sitemap: escenarios de datos", () => {
  it("sin proveedores aprobados: solo las páginas fijas", () => {
    const fijas = paginasFijas().map((e) => e.url);
    expect(urls({})).toEqual(fijas);
    expect(fijas.some((u) => u.includes("/servicios/") || u.includes("/localidades/"))).toBe(false);
  });

  it("incluye la ficha de un proveedor indexable en su ruta /nombre/oficio y la fecha real de modificación", () => {
    const e = construirSitemap({ ...vacio, proveedores: [{ slug: "jorge-perez", actualizado: "2026-11-01T10:00:00.000Z", oficios: [conUrgencias.nombre] }] }).find((x) => x.url === ruta(rutaProveedor("jorge-perez", conUrgencias.nombre)));
    expect(e).toBeDefined();
    expect(e!.lastModified).toBe("2026-11-01T10:00:00.000Z");
  });

  it("excluye datos incompletos: una ficha sin oficios no aparece", () => {
    expect(urls({ proveedores: [{ slug: "sin-oficio", actualizado: "2026-11-01T00:00:00.000Z", oficios: [] }] }).some((u) => u.includes("sin-oficio"))).toBe(false);
  });

  it("no repite una URL aunque dos oficios del proveedor den la misma ruta", () => {
    const lista = urls({ proveedores: [{ slug: "ana", actualizado: "2026-11-01T00:00:00.000Z", oficios: [conUrgencias.nombre, conUrgencias.nombre] }] });
    expect(new Set(lista).size).toBe(lista.length);
  });

  it("localidades: solo entran las que tienen oferta y existen", () => {
    const lista = urls({ localidades: [localidad, "no-existe"] });
    expect(lista).toContain(ruta(`/localidades/${localidad}`));
    expect(lista).not.toContain(ruta(`/localidades/${otraLocalidad}`));
    expect(lista.some((u) => u.includes("no-existe"))).toBe(false);
  });

  it("servicios: la página del oficio entra solo con el mínimo de proveedores (3)", () => {
    const oficio = (total: number) => ({ oficio: sinUrgencias.slug, total, urgentes: 0, conPrecio: 0, modificado: null });
    expect(urls({ oficios: [oficio(2)] })).not.toContain(ruta(`/servicios/${sinUrgencias.slug}`));
    expect(urls({ oficios: [oficio(3)] })).toContain(ruta(`/servicios/${sinUrgencias.slug}`));
  });

  it("servicios: «urgente» solo si el oficio atiende urgencias y hay proveedores; «económico» solo con precios", () => {
    const base = (o: string, urgentes: number, conPrecio: number) => ({ oficio: o, total: 5, urgentes, conPrecio, modificado: null });
    expect(urls({ oficios: [base(conUrgencias.slug, 3, 0)] })).toContain(ruta(`/servicios/${conUrgencias.slug}/urgente`));
    expect(urls({ oficios: [base(sinUrgencias.slug, 5, 0)] })).not.toContain(ruta(`/servicios/${sinUrgencias.slug}/urgente`));
    expect(urls({ oficios: [base(sinUrgencias.slug, 0, 2)] })).not.toContain(ruta(`/servicios/${sinUrgencias.slug}/economico`));
    expect(urls({ oficios: [base(sinUrgencias.slug, 0, 3)] })).toContain(ruta(`/servicios/${sinUrgencias.slug}/economico`));
  });

  it("oficio + localidad: con mínimo entra; con menos, oficio inexistente o localidad inexistente, no", () => {
    const c = (o: string, l: string, total: number) => ({ oficio: o, localidad: l, total, modificado: null });
    const lista = urls({ combinaciones: [c(sinUrgencias.slug, localidad, 3), c(sinUrgencias.slug, otraLocalidad, 2), c("oficio-inventado", localidad, 9), c(sinUrgencias.slug, "localidad-inventada", 9)] });
    expect(lista).toContain(ruta(`/servicios/${sinUrgencias.slug}/${localidad}`));
    expect(lista).not.toContain(ruta(`/servicios/${sinUrgencias.slug}/${otraLocalidad}`));
    expect(lista.some((u) => u.includes("inventad"))).toBe(false);
  });

  it("todas las URLs son absolutas, sin parámetros ni rutas privadas o de resultados", () => {
    const lista = urls({
      proveedores: [{ slug: "ana", actualizado: "2026-11-01T00:00:00.000Z", oficios: [conUrgencias.nombre] }],
      localidades: [localidad],
      oficios: [{ oficio: conUrgencias.slug, total: 9, urgentes: 9, conPrecio: 9, modificado: null }],
      combinaciones: [{ oficio: conUrgencias.slug, localidad, total: 9, modificado: null }],
    });
    for (const u of lista) {
      expect(u.startsWith("https://")).toBe(true);
      expect(u).not.toContain("?");
      expect(u).not.toMatch(/\/(admin|panel|api|cuenta|ingreso|ingresar|registro|contactar|reportar|consentimiento|calificar)(\/|$)/);
    }
    expect(new Set(lista).size).toBe(lista.length);
  });
});

describe("robots.txt", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("en producción bloquea solo backoffice, API y zonas con sesión; no bloquea páginas noindex ni el sitemap", async () => {
    vi.stubEnv("SITIO_INDEXABLE", "true");
    vi.resetModules();
    const { default: robots, RUTAS_BLOQUEADAS } = await import("@/app/robots");
    const r = robots();
    const regla = Array.isArray(r.rules) ? r.rules[0]! : r.rules;
    expect(regla.disallow).toEqual(RUTAS_BLOQUEADAS);
    // Páginas con noindex: Google debe poder rastrearlas para leer esa directiva.
    for (const p of ["/ingreso", "/contactar", "/reportar", "/proveedores", "/proveedores/registro", "/recuperar", "/nueva-clave", "/consentimiento"]) {
      expect(RUTAS_BLOQUEADAS.some((b) => p.startsWith(b))).toBe(false);
    }
    // Lo importante sí se rastrea.
    for (const p of ["/", "/proveedores", "/servicios/plomero", "/localidades/suba", "/guias", "/sitemap.xml"]) {
      expect(RUTAS_BLOQUEADAS.some((b) => p.startsWith(b))).toBe(false);
    }
    expect(r.sitemap).toBe(`${SITIO_URL}/sitemap.xml`);
  });

  it("invita a los rastreadores de IA con las mismas rutas bloqueadas", async () => {
    vi.stubEnv("SITIO_INDEXABLE", "true");
    vi.resetModules();
    const { default: robots, RUTAS_BLOQUEADAS, RASTREADORES_IA } = await import("@/app/robots");
    const reglas = robots().rules as { userAgent: string | string[]; allow?: string; disallow?: string[] }[];
    const ia = reglas.find((x) => Array.isArray(x.userAgent) && x.userAgent.includes("GPTBot"))!;
    expect(ia.userAgent).toEqual(RASTREADORES_IA);
    expect(ia.allow).toBe("/");
    expect(ia.disallow).toEqual(RUTAS_BLOQUEADAS);
    for (const b of ["ClaudeBot", "PerplexityBot", "Google-Extended"]) expect(RASTREADORES_IA).toContain(b);
  });

  it("el sitemap declara las imágenes de la ficha y de «Cómo funciona»", async () => {
    const { construirSitemap } = await import("@/lib/sitemap-construir");
    const e = construirSitemap({ proveedores: [{ slug: "ana", actualizado: "2026-11-01T00:00:00.000Z", oficios: ["Aseo"], imagenes: ["https://x/a.jpg"] }], localidades: [], oficios: [], combinaciones: [], minimo: 3 });
    expect(e.find((x) => x.url.endsWith("/ana/aseo"))?.images).toEqual(["https://x/a.jpg"]);
    expect(e.find((x) => x.url.endsWith("/como-funciona"))?.images?.length).toBe(9);
  });

  it("fuera de producción cierra todo el sitio", async () => {
    vi.stubEnv("SITIO_INDEXABLE", "false");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.resetModules();
    const { default: robots } = await import("@/app/robots");
    const regla = robots().rules as { disallow: string };
    expect(regla.disallow).toBe("/");
  });
});

describe("metadata: canonical y noindex", () => {
  const base = { titulo: "Plomero en Suba", descripcion: "x".repeat(130), ruta: "/servicios/plomero/suba" };

  it("página indexable: canonical a sí misma y sin directiva de robots propia", () => {
    const m = meta(base);
    expect(m.alternates?.canonical).toBe(base.ruta);
    expect(m.robots).toBeUndefined();
  });

  it("página noindex: noindex + follow y canonical a sí misma (nunca a otra URL)", () => {
    const m = meta({ ...base, noindex: true });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe(base.ruta);
  });

  it("el título lleva la marca una sola vez", () => {
    expect(String((meta(base).title as { absolute: string }).absolute).match(/LasTresB/g)).toHaveLength(1);
    expect(String((meta({ ...base, titulo: "Hola | LasTresB" }).title as { absolute: string }).absolute).match(/LasTresB/g)).toHaveLength(1);
  });
});

describe("schema de la ficha del proveedor", () => {
  const datos = { slug: "ana", ruta: "/ana/plomeria", nombre: "Ana Gómez", servicios: ["Plomería"], localidades: ["Suba"], ofertas: [{ nombre: "Fugas", precioDesde: "50000" }] };
  const resena = { autor: "Luis", estrellas: 5, texto: "Muy bien", fecha: new Date("2026-10-01") };

  it("independiente: ProfilePage con una Person, sin LocalBusiness, sin dirección y sin calificación agregada", () => {
    const j = jsonLdProveedor({ ...datos, esEmpresa: false, calificacion: { promedio: 5, total: 1 }, resenas: [resena] }) as Record<string, any>;
    expect(j["@type"]).toBe("ProfilePage");
    expect(j.mainEntity["@type"]).toBe("Person");
    expect(JSON.stringify(j)).not.toContain("LocalBusiness");
    expect(j.mainEntity.address).toBeUndefined();
    expect(j.mainEntity.aggregateRating).toBeUndefined();
    expect(j.mainEntity.review).toHaveLength(1);
  });

  it("empresa: Organization con zona de cobertura y calificación solo si hay reseñas reales", () => {
    const con = jsonLdProveedor({ ...datos, esEmpresa: true, calificacion: { promedio: 4.5, total: 2 } }) as Record<string, any>;
    expect(con.mainEntity["@type"]).toBe("Organization");
    expect(con.mainEntity.areaServed).toHaveLength(1);
    expect(con.mainEntity.aggregateRating.reviewCount).toBe(2);
    const sin = jsonLdProveedor({ ...datos, esEmpresa: true, calificacion: { promedio: 0, total: 0 } }) as Record<string, any>;
    expect(sin.mainEntity.aggregateRating).toBeUndefined();
    expect(sin.mainEntity.review).toBeUndefined();
  });

  it("no inventa precios ni reseñas: sin precio no hay especificación de precio", () => {
    const j = jsonLdProveedor({ ...datos, ofertas: [{ nombre: "Visita", precioDesde: null }] }) as Record<string, any>;
    expect(JSON.stringify(j)).not.toContain("priceSpecification");
  });
});

describe("enlaces internos y URLs inexistentes", () => {
  it("cada tarjeta del Home lleva a /proveedores con oficios o categorías que existen", () => {
    for (const t of construirMosaico(CATEGORIAS)) {
      expect(t.href.startsWith("/proveedores?categoria=")).toBe(true);
      const slugs = decodeURIComponent(t.href.split("categoria=")[1]!).split(",");
      expect(slugs.length).toBeGreaterThan(0);
      for (const s of slugs) expect(Boolean(subcategoriaPorSlug(s) || categoriaPorSlug(s)), `${s} no existe`).toBe(true);
    }
  });

  it("los slugs inventados no resuelven (así la página responde 404 y no se enlaza)", () => {
    expect(subcategoriaPorSlug("oficio-inventado")).toBeUndefined();
    expect(LOCALIDADES_BOGOTA.map((l) => l.slug as string).includes("localidad-inventada")).toBe(false);
  });

  it("la ruta de cada oficio del proveedor es /nombre/oficio con un segmento válido", () => {
    for (const { sub } of TODAS_LAS_SUBCATEGORIAS.slice(0, 15)) expect(rutaProveedor("ana", sub.nombre)).toMatch(/^\/ana\/[a-z0-9-]+$/);
  });
});

describe("ALT de las fotos de trabajos", () => {
  const sinTexto = { descripcion: null };

  it("usa la descripción del proveedor si la escribió", () => {
    expect(altFotoTrabajo({ descripcion: "Baño remodelado con ducha de lluvia" }, "Plomería", 1, 3)).toBe("Baño remodelado con ducha de lluvia");
  });

  it("sin descripción: dice qué es y cuál es, sin nombre del proveedor y distinto en cada foto", () => {
    const a = altFotoTrabajo(sinTexto, "Plomería", 1, 3);
    const b = altFotoTrabajo(sinTexto, "Plomería", 2, 3);
    expect(a).toBe("Foto de un trabajo de plomería (1 de 3)");
    expect(a).not.toBe(b);
  });

  it("no inventa lo que muestra la imagen ni deja el texto vacío", () => {
    expect(altFotoTrabajo({ descripcion: "   " }, null)).toBe("Foto de un trabajo");
  });
});

/**
 * P2 · Búsqueda de proveedores (CU-01) con filtros, orden y paginación (mockups Resultados_web / Resultados_movil).
 * Solo proveedores `aprobado` o `en_revision` (regla 6 de CLAUDE.md).
 * Nunca devuelve datos privados (regla 1): sin documento, dirección, RUT ni fecha de nacimiento.
 */
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const {
  proveedores,
  proveedorCategorias,
  proveedorLocalidades,
  proveedorInsignias,
  categorias,
  localidades,
  terminosBusqueda,
  insignias,
} = schema;

export { INSIGNIAS_FILTRO, ORDENES, type InsigniaFiltro, type Orden } from "@/lib/filtros";
import { ORDENES, valoresDesdeParams, type InsigniaFiltro, type Orden } from "@/lib/filtros";

export const POR_PAGINA = 10;

/** Convierte los parámetros de /buscar (URL) en filtros; lo comparten la página y la API de conteo. */
export function filtrosDesdeParams(p: URLSearchParams): FiltrosBusqueda {
  const v = valoresDesdeParams(p);
  const orden = ORDENES.find((o) => o === p.get("orden"));
  return {
    q: p.get("q") || undefined,
    localidad: p.get("localidad") || undefined,
    categoria: p.get("categoria") || undefined,
    tambien: v.tambien,
    insignias: v.insignias,
    calificacionMin: Number(v.cal) || undefined,
    visitaMax: v.visita && v.visita !== "convenir" ? Number(v.visita) : undefined,
    visitaConvenir: v.visita === "convenir",
    urgenteHoy: v.hoy,
    h24: v.h24,
    orden,
    pagina: Math.max(1, Number(p.get("pagina")) || 1),
  };
}

export type FiltrosBusqueda = {
  q?: string;
  localidad?: string;
  categoria?: string;
  /** Localidades vecinas adicionales (slugs). */
  tambien?: string[];
  insignias?: InsigniaFiltro[];
  /** Calificación mínima (4 o 4.5). */
  calificacionMin?: number;
  /** Precio máximo de la visita («desde») en COP. */
  precioMax?: number;
  /** Solo proveedores que declaran atender urgencias o 24 horas. */
  urgencias?: boolean;
  /** Solo proveedores con «precio desde» publicado. */
  conPrecio?: boolean;
  /** Tope del precio de visita publicado (servicios con unidad «visita»), en COP. */
  visitaMax?: number;
  /** Solo proveedores que marcaron «visita a convenir». */
  visitaConvenir?: boolean;
  /** Solo quienes declaran atender urgencias el mismo día. */
  urgenteHoy?: boolean;
  /** Solo quienes declaran atender 24 horas. */
  h24?: boolean;
  orden?: Orden;
  pagina?: number;
};

export type ResultadoBusqueda = {
  slug: string;
  nombre: string;
  servicios: string[];
  localidades: string[];
  promedio: number;
  totalResenas: number;
  insignias: { clave: string; nombre: string }[];
  precioDesde: number | null;
  atiendeUrgencias: boolean;
  disponible24h: boolean;
  /** Menor «precio desde» de un servicio con unidad visita; null si no publicó. */
  precioVisita: number | null;
  visitaAConvenir: boolean;
};

export type PaginaResultados = {
  items: ResultadoBusqueda[];
  total: number;
  pagina: number;
  porPagina: number;
  /** Nombre de la categoría filtrada, si hay una. */
  categoriaNombre: string | null;
};

const ESTADOS_VISIBLES = ["aprobado", "en_revision"] as const;

/** La categoría puede ser una subcategoría o una categoría padre (incluye sus hijas). */
async function resolverCategoria(slug: string | undefined): Promise<{ ids: number[]; nombre: string } | null> {
  if (!slug) return null;
  const [c] = await db
    .select({ id: categorias.id, nombre: categorias.nombre })
    .from(categorias)
    .where(eq(categorias.slug, slug))
    .limit(1);
  if (!c) return null;
  const hijas = await db.select({ id: categorias.id }).from(categorias).where(eq(categorias.padreId, c.id));
  return { ids: [c.id, ...hijas.map((h) => h.id)], nombre: c.nombre };
}

async function resolverLocalidadIds(slugs: string[]): Promise<number[]> {
  if (slugs.length === 0) return [];
  const filas = await db.select({ id: localidades.id }).from(localidades).where(inArray(localidades.slug, slugs));
  return filas.map((f) => f.id);
}

/** Minúsculas y sin tildes, sin depender de la extensión unaccent. */
const sinTildes = (valor: SQL) => sql`translate(lower(${valor}), 'áéíóúüñ', 'aeiouun')`;

/** IDs de categorías cuyos sinónimos (terminos_busqueda) coinciden con el término. */
async function categoriasPorTermino(termino: string): Promise<number[]> {
  if (!termino.trim()) return [];
  const hits = await db
    .select({ categoriaId: terminosBusqueda.categoriaId })
    .from(terminosBusqueda)
    .where(sql`${sinTildes(sql`${terminosBusqueda.termino}`)} LIKE '%' || ${sinTildes(sql`${termino}`)} || '%'`);
  return [...new Set(hits.map((h) => h.categoriaId))];
}

const lista = (ids: number[]) =>
  sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );

/** Precio «desde» más bajo entre los servicios visibles del proveedor. */
const precioMinimo = sql<string | null>`(SELECT MIN(s.precio_desde) FROM servicios_proveedor s WHERE s.proveedor_id = "proveedores"."id" AND s.visible AND s.precio_desde IS NOT NULL)`;

/** Precio «desde» más bajo entre los servicios visibles con unidad «visita»: el precio de la visita. */
const precioVisitaSql = sql<string | null>`(SELECT MIN(s.precio_desde) FROM servicios_proveedor s WHERE s.proveedor_id = "proveedores"."id" AND s.visible AND s.unidad = 'visita' AND s.precio_desde IS NOT NULL)`;

async function condicionesDe(f: FiltrosBusqueda) {
  const q = f.q?.trim();

  const categoria = await resolverCategoria(f.categoria);
  const slugsLocalidad = [f.localidad, ...(f.tambien ?? [])].filter((s): s is string => Boolean(s));
  const localidadIds = await resolverLocalidadIds(slugsLocalidad);
  const porTermino = q && !categoria ? await categoriasPorTermino(q) : [];

  const condiciones: SQL[] = [inArray(proveedores.estado, [...ESTADOS_VISIBLES])];

  if (localidadIds.length > 0) {
    condiciones.push(
      sql`${proveedores.id} IN (SELECT proveedor_id FROM ${proveedorLocalidades} WHERE localidad_id IN (${lista(localidadIds)}))`,
    );
  }

  if (categoria) {
    condiciones.push(
      sql`${proveedores.id} IN (SELECT proveedor_id FROM ${proveedorCategorias} WHERE categoria_id IN (${lista(categoria.ids)}))`,
    );
  } else if (q) {
    const porNombre = sql`${sinTildes(sql`${proveedores.nombrePublico}`)} LIKE '%' || ${sinTildes(sql`${q}`)} || '%'`;
    condiciones.push(
      porTermino.length > 0
        ? sql`(${porNombre} OR ${proveedores.id} IN (SELECT proveedor_id FROM ${proveedorCategorias} WHERE categoria_id IN (${lista(porTermino)})))`
        : porNombre,
    );
  }

  for (const clave of f.insignias ?? []) {
    condiciones.push(
      sql`${proveedores.id} IN (SELECT pi.proveedor_id FROM ${proveedorInsignias} pi JOIN ${insignias} i ON i.id = pi.insignia_id WHERE i.clave = ${clave} AND (pi.vence IS NULL OR pi.vence >= CURRENT_DATE))`,
    );
  }

  if (f.calificacionMin) condiciones.push(sql`${proveedores.promedio} >= ${f.calificacionMin}`);
  if (f.precioMax) condiciones.push(sql`${precioMinimo} <= ${f.precioMax}`);
  if (f.urgencias) condiciones.push(sql`(${proveedores.atiendeUrgencias} OR ${proveedores.disponible24h})`);
  if (f.conPrecio) condiciones.push(sql`${precioMinimo} IS NOT NULL`);
  if (f.visitaMax) condiciones.push(sql`${precioVisitaSql} <= ${f.visitaMax}`);
  if (f.visitaConvenir) condiciones.push(sql`${proveedores.visitaAConvenir}`);
  if (f.urgenteHoy) condiciones.push(sql`${proveedores.atiendeUrgencias}`);
  if (f.h24) condiciones.push(sql`${proveedores.disponible24h}`);

  return { donde: and(...condiciones), categoria };
}

/** Cuántos proveedores cumplen los filtros (para «Ver N proveedores» en vivo). */
export async function contarProveedores(f: FiltrosBusqueda): Promise<number> {
  const { donde } = await condicionesDe(f);
  const [c] = await db.select({ total: sql<number>`count(*)::int` }).from(proveedores).where(donde);
  return c?.total ?? 0;
}

export async function buscarProveedores(f: FiltrosBusqueda): Promise<PaginaResultados> {
  const pagina = Math.max(1, Math.floor(f.pagina ?? 1));
  const { donde, categoria } = await condicionesDe(f);
  const total = await contarProveedores(f);

  const orden: SQL[] =
    f.orden === "resenas"
      ? [sql`${proveedores.totalResenas} DESC`, sql`${proveedores.promedio} DESC`]
      : f.orden === "precio"
        ? [sql`${precioMinimo} ASC NULLS LAST`, sql`${proveedores.promedio} DESC`]
        : [sql`${proveedores.promedio} DESC`, sql`${proveedores.totalResenas} DESC`];

  const filas = await db
    .select({
      id: proveedores.id,
      slug: proveedores.slug,
      nombre: proveedores.nombrePublico,
      promedio: proveedores.promedio,
      totalResenas: proveedores.totalResenas,
      precio: precioMinimo,
      precioVisita: precioVisitaSql,
      convenir: proveedores.visitaAConvenir,
      urgencias: proveedores.atiendeUrgencias,
      h24: proveedores.disponible24h,
    })
    .from(proveedores)
    .where(donde)
    .orderBy(...orden, sql`${proveedores.createdAt} DESC`)
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  if (filas.length === 0) {
    return { items: [], total, pagina, porPagina: POR_PAGINA, categoriaNombre: categoria?.nombre ?? null };
  }

  const ids = filas.map((r) => r.id);

  const [servicios, zonas, distintivos] = await Promise.all([
    db
      .select({ proveedorId: proveedorCategorias.proveedorId, nombre: categorias.nombre })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(inArray(proveedorCategorias.proveedorId, ids)),
    db
      .select({ proveedorId: proveedorLocalidades.proveedorId, nombre: localidades.nombre })
      .from(proveedorLocalidades)
      .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
      .where(inArray(proveedorLocalidades.proveedorId, ids)),
    db
      .select({ proveedorId: proveedorInsignias.proveedorId, clave: insignias.clave, nombre: insignias.nombre, vence: proveedorInsignias.vence })
      .from(proveedorInsignias)
      .innerJoin(insignias, eq(insignias.id, proveedorInsignias.insigniaId))
      .where(inArray(proveedorInsignias.proveedorId, ids)),
  ]);

  const agrupar = <T extends { proveedorId: string }, V>(filasT: T[], valor: (t: T) => V) => {
    const mapa = new Map<string, V[]>();
    for (const t of filasT) mapa.set(t.proveedorId, [...(mapa.get(t.proveedorId) ?? []), valor(t)]);
    return mapa;
  };
  const hoy = new Date().toISOString().slice(0, 10);
  const serviciosMapa = agrupar(servicios, (s) => s.nombre);
  const zonasMapa = agrupar(zonas, (z) => z.nombre);
  const insigniasMapa = agrupar(
    distintivos.filter((d) => !d.vence || d.vence >= hoy),
    (d) => ({ clave: d.clave, nombre: d.nombre }),
  );

  return {
    items: filas.map((r) => ({
      slug: r.slug,
      nombre: r.nombre,
      servicios: serviciosMapa.get(r.id) ?? [],
      localidades: zonasMapa.get(r.id) ?? [],
      promedio: Number(r.promedio ?? 0),
      totalResenas: r.totalResenas,
      insignias: insigniasMapa.get(r.id) ?? [],
      precioDesde: r.precio != null ? Number(r.precio) : null,
      atiendeUrgencias: r.urgencias,
      disponible24h: r.h24,
      precioVisita: r.precioVisita != null ? Number(r.precioVisita) : null,
      visitaAConvenir: r.convenir,
    })),
    total,
    pagina,
    porPagina: POR_PAGINA,
    categoriaNombre: categoria?.nombre ?? null,
  };
}

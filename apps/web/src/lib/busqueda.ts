/**
 * P2 · Búsqueda de proveedores (CU-01).
 * Solo proveedores `aprobado` o `en_revision` (regla 6 de CLAUDE.md).
 * Nunca devuelve datos privados (regla 1): sin documento, dirección, RUT ni fecha de nacimiento.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const {
  proveedores,
  proveedorCategorias,
  proveedorLocalidades,
  categorias,
  localidades,
  terminosBusqueda,
} = schema;

export type ResultadoBusqueda = {
  slug: string;
  nombre: string;
  servicio: string;
  localidades: string[];
  promedio: number;
  totalResenas: number;
};

const ESTADOS_VISIBLES = ["aprobado", "en_revision"] as const;

async function resolverCategoriaId(slug: string | undefined): Promise<number | null> {
  if (!slug) return null;
  const [c] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(eq(categorias.slug, slug))
    .limit(1);
  return c?.id ?? null;
}

async function resolverLocalidadId(slug: string | undefined): Promise<number | null> {
  if (!slug) return null;
  const [l] = await db
    .select({ id: localidades.id })
    .from(localidades)
    .where(eq(localidades.slug, slug))
    .limit(1);
  return l?.id ?? null;
}

/** IDs de categorías cuyos sinónimos (terminos_busqueda) coinciden con el término. */
async function categoriasPorTermino(termino: string): Promise<number[]> {
  if (!termino.trim()) return [];
  const hits = await db
    .select({ categoriaId: terminosBusqueda.categoriaId })
    .from(terminosBusqueda)
    .where(sql`unaccent(${terminosBusqueda.termino}) ILIKE unaccent('%' || ${termino} || '%')`);
  return [...new Set(hits.map((h) => h.categoriaId))];
}

export async function buscarProveedores({
  q,
  localidad,
  categoria,
}: {
  q?: string;
  localidad?: string;
  categoria?: string;
}): Promise<ResultadoBusqueda[]> {
  const categoriaId = await resolverCategoriaId(categoria);
  const localidadId = await resolverLocalidadId(localidad);
  const categoriasTermino = q ? await categoriasPorTermino(q) : [];

  const condiciones = [inArray(proveedores.estado, ESTADOS_VISIBLES)];

  if (localidadId !== null) {
    condiciones.push(
      sql`${proveedores.id} IN (SELECT proveedor_id FROM ${proveedorLocalidades} WHERE localidad_id = ${localidadId})`
    );
  }

  const categoriasPermitidas = categoriaId !== null ? [categoriaId] : categoriasTermino;
  if (categoriasPermitidas.length > 0) {
    condiciones.push(
      sql`${proveedores.id} IN (SELECT proveedor_id FROM ${proveedorCategorias} WHERE categoria_id IN (${sql.join(
        categoriasPermitidas.map((id) => sql`${id}`),
        ", "
      )}))`
    );
  }

  const filas = await db
    .select({
      id: proveedores.id,
      slug: proveedores.slug,
      nombre: proveedores.nombrePublico,
      promedio: proveedores.promedio,
      totalResenas: proveedores.totalResenas,
    })
    .from(proveedores)
    .where(and(...condiciones))
    .orderBy(
      // 1. Coincidencia directa del término en el nombre del proveedor.
      q
        ? sql`(CASE WHEN unaccent(${proveedores.nombrePublico}) ILIKE unaccent('%' || ${q} || '%') THEN 0 ELSE 1 END)`
        : sql`0`,
      // 2. Calificación (cobertura de localidad ya filtrada si se indicó).
      sql`(${proveedores.promedio}) DESC NULLS LAST`,
      sql`${proveedores.createdAt} DESC`
    );

  if (filas.length === 0) return [];

  const ids = filas.map((f) => f.id);

  const [serviciosPorProveedor, zonasPorProveedor] = await Promise.all([
    db
      .select({
        proveedorId: proveedorCategorias.proveedorId,
        nombre: categorias.nombre,
      })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(inArray(proveedorCategorias.proveedorId, ids)),
    db
      .select({
        proveedorId: proveedorLocalidades.proveedorId,
        nombre: localidades.nombre,
      })
      .from(proveedorLocalidades)
      .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
      .where(inArray(proveedorLocalidades.proveedorId, ids)),
  ]);

  const serviciosMap = new Map<string, string[]>();
  for (const s of serviciosPorProveedor) {
    const arr = serviciosMap.get(s.proveedorId) ?? [];
    arr.push(s.nombre);
    serviciosMap.set(s.proveedorId, arr);
  }
  const zonasMap = new Map<string, string[]>();
  for (const z of zonasPorProveedor) {
    const arr = zonasMap.get(z.proveedorId) ?? [];
    arr.push(z.nombre);
    zonasMap.set(z.proveedorId, arr);
  }

  return filas.map((f) => ({
    slug: f.slug,
    nombre: f.nombre,
    servicio: (serviciosMap.get(f.id) ?? [])[0] ?? "",
    localidades: zonasMap.get(f.id) ?? [],
    promedio: Number(f.promedio ?? 0),
    totalResenas: f.totalResenas,
  }));
}

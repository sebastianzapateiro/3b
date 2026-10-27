/**
 * P7 · Resolución pública de un portafolio por slug (RF-37–43, regla 6).
 * La usan la página /[slug], el sitemap y, más adelante, /api/v1. Nunca devuelve datos privados (regla 1).
 */
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { slugSchema } from "@las3b/shared";

const { proveedores, proveedorCategorias, proveedorLocalidades, categorias, localidades, slugsHistorial } = schema;

export type PortafolioPublico = {
  slug: string;
  nombre: string;
  presentacion: string | null;
  servicios: string[];
  localidades: string[];
  promedio: number;
  totalResenas: number;
};

export type ResultadoPortafolio =
  | { tipo: "publicado"; proveedor: PortafolioPublico }
  | { tipo: "no_disponible"; nombre: string }
  | { tipo: "redirigir"; slug: string }
  | { tipo: "no_existe" };

export async function obtenerPortafolio(slug: string): Promise<ResultadoPortafolio> {
  if (!slugSchema.safeParse(slug).success) return { tipo: "no_existe" };

  const [p] = await db
    .select({
      id: proveedores.id,
      slug: proveedores.slug,
      estado: proveedores.estado,
      nombre: proveedores.nombrePublico,
      presentacion: proveedores.presentacion,
      promedio: proveedores.promedio,
      totalResenas: proveedores.totalResenas,
    })
    .from(proveedores)
    .where(eq(proveedores.slug, slug))
    .limit(1);

  if (!p) {
    const [anterior] = await db
      .select({ slug: proveedores.slug })
      .from(slugsHistorial)
      .innerJoin(proveedores, eq(proveedores.id, slugsHistorial.proveedorId))
      .where(and(eq(slugsHistorial.slug, slug), inArray(proveedores.estado, ["aprobado", "en_revision", "pausado"])))
      .limit(1);
    return anterior ? { tipo: "redirigir", slug: anterior.slug } : { tipo: "no_existe" };
  }

  if (p.estado === "pausado" || p.estado === "pausado_por_rut") return { tipo: "no_disponible", nombre: p.nombre };
  if (p.estado !== "aprobado" && p.estado !== "en_revision") return { tipo: "no_existe" };

  const [servicios, zonas] = await Promise.all([
    db
      .select({ nombre: categorias.nombre })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(eq(proveedorCategorias.proveedorId, p.id)),
    db
      .select({ nombre: localidades.nombre })
      .from(proveedorLocalidades)
      .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
      .where(eq(proveedorLocalidades.proveedorId, p.id)),
  ]);

  return {
    tipo: "publicado",
    proveedor: {
      slug: p.slug,
      nombre: p.nombre,
      presentacion: p.presentacion,
      servicios: servicios.map((s) => s.nombre),
      localidades: zonas.map((z) => z.nombre),
      promedio: p.promedio,
      totalResenas: p.totalResenas,
    },
  };
}

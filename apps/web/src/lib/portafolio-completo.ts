/**
 * P7 · Portafolio público completo del proveedor (RF-37 a RF-43).
 * Solo datos públicos: nunca documento, dirección, RUT ni fecha de nacimiento (regla 1).
 */
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const {
  proveedores,
  proveedorCategorias,
  categorias,
  proveedorLocalidades,
  localidades,
  serviciosProveedor,
  portafolioFotos,
  proveedorInsignias,
  insignias,
  resenas,
  user,
} = schema;

const ESTADOS_VISIBLES = ["aprobado", "en_revision"] as const;

export type ServicioPublico = {
  nombre: string;
  descripcion: string | null;
  precioDesde: string | null;
  unidad: string;
};

export type FotoTrabajo = {
  id: string;
  ruta: string;
  rutaMiniatura: string | null;
  descripcion: string | null;
};

export type InsigniaPublica = {
  clave: string;
  nombre: string;
};

export type ResenaPublica = {
  nombreCliente: string;
  estrellas: number;
  comentario: string | null;
  creadoEn: Date;
  respuesta: string | null;
};

export type PortafolioCompleto = {
  slug: string;
  nombre: string;
  presentacion: string | null;
  whatsapp: string;
  categoriaPrincipal: string | null;
  localidadPrincipal: string | null;
  servicios: ServicioPublico[];
  fotos: FotoTrabajo[];
  insignias: InsigniaPublica[];
  resenas: ResenaPublica[];
  promedio: number;
  totalResenas: number;
  /** Todas las categorías y localidades del proveedor. */
  categorias: string[];
  localidades: string[];
  /** Fecha de alta, para «En Las 3B desde». */
  desde: Date;
  /** Cantidad de reseñas visibles por estrellas (índice 0 = 1 estrella). */
  distribucion: number[];
  /** Enlaces internos a las páginas de servicio + localidad (SEO). */
  enlaces: { texto: string; ruta: string }[];
  /** Perfil de muestra (no es un proveedor real). */
  esEjemplo?: boolean;
};

export type ResultadoPortafolioCompleto =
  | { tipo: "publicado"; proveedor: PortafolioCompleto }
  | { tipo: "no_disponible"; nombre: string }
  | { tipo: "redirigir"; slug: string }
  | { tipo: "no_existe" };

export async function obtenerPortafolioCompleto(
  slug: string,
): Promise<ResultadoPortafolioCompleto> {
  const slugSchema = (await import("@las3b/shared")).slugSchema;
  if (!slugSchema.safeParse(slug).success) return { tipo: "no_existe" };

  const [p] = await db
    .select({
      id: proveedores.id,
      slug: proveedores.slug,
      estado: proveedores.estado,
      nombre: proveedores.nombrePublico,
      presentacion: proveedores.presentacion,
      whatsapp: proveedores.whatsapp,
      promedio: proveedores.promedio,
      totalResenas: proveedores.totalResenas,
      desde: proveedores.createdAt,
    })
    .from(proveedores)
    .where(eq(proveedores.slug, slug))
    .limit(1);

  if (!p) {
    const { slugsHistorial } = schema;
    const [anterior] = await db
      .select({ slug: proveedores.slug })
      .from(slugsHistorial)
      .innerJoin(proveedores, eq(proveedores.id, slugsHistorial.proveedorId))
      .where(
        and(
          eq(slugsHistorial.slug, slug),
          inArray(proveedores.estado, ESTADOS_VISIBLES),
        ),
      )
      .limit(1);
    return anterior ? { tipo: "redirigir", slug: anterior.slug } : { tipo: "no_existe" };
  }

  if (p.estado === "pausado" || p.estado === "pausado_por_rut") {
    return { tipo: "no_disponible", nombre: p.nombre };
  }
  if (p.estado !== "aprobado" && p.estado !== "en_revision") {
    return { tipo: "no_existe" };
  }

  const [servicios, fotos, filasInsignias, filasResenas, cats, locs, conteo] =
    await Promise.all([
      db
        .select({
          nombre: serviciosProveedor.nombre,
          descripcion: serviciosProveedor.descripcion,
          precioDesde: serviciosProveedor.precioDesde,
          unidad: serviciosProveedor.unidad,
        })
        .from(serviciosProveedor)
        .where(
          and(
            eq(serviciosProveedor.proveedorId, p.id),
            eq(serviciosProveedor.visible, true),
          ),
        )
        .orderBy(serviciosProveedor.orden),

      db
        .select({
          id: portafolioFotos.id,
          ruta: portafolioFotos.ruta,
          rutaMiniatura: portafolioFotos.rutaMiniatura,
          descripcion: portafolioFotos.descripcion,
        })
        .from(portafolioFotos)
        .where(
          and(
            eq(portafolioFotos.proveedorId, p.id),
            eq(portafolioFotos.estado, "visible"),
          ),
        )
        .orderBy(portafolioFotos.orden)
        .limit(12),

      db
        .select({
          clave: insignias.clave,
          nombre: insignias.nombre,
        })
        .from(proveedorInsignias)
        .innerJoin(insignias, eq(insignias.id, proveedorInsignias.insigniaId))
        .where(eq(proveedorInsignias.proveedorId, p.id)),

      db
        .select({
          comentario: resenas.comentario,
          estrellas: sql<number>`round((${resenas.puntualidad} + ${resenas.calidad} + ${resenas.calidadPrecio} + ${resenas.cumplimiento}) / 4.0)`,
          creadoEn: resenas.createdAt,
          nombreCliente: user.name,
          respuesta: schema.respuestasResena.texto,
        })
        .from(resenas)
        .innerJoin(user, eq(user.id, resenas.compradorId))
        .leftJoin(schema.respuestasResena, and(eq(schema.respuestasResena.resenaId, resenas.id), eq(schema.respuestasResena.estado, "visible")))
        .where(
          and(
            eq(resenas.proveedorId, p.id),
            eq(resenas.estado, "visible"),
          ),
        )
        .orderBy(desc(resenas.createdAt))
        .limit(10),

      db
        .select({ nombre: categorias.nombre, slug: categorias.slug })
        .from(proveedorCategorias)
        .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
        .where(eq(proveedorCategorias.proveedorId, p.id)),

      db
        .select({ nombre: localidades.nombre, slug: localidades.slug })
        .from(proveedorLocalidades)
        .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
        .where(eq(proveedorLocalidades.proveedorId, p.id)),

      db
        .select({ estrellas: sql<number>`round((${resenas.puntualidad} + ${resenas.calidad} + ${resenas.calidadPrecio} + ${resenas.cumplimiento}) / 4.0)`, total: count() })
        .from(resenas)
        .where(and(eq(resenas.proveedorId, p.id), eq(resenas.estado, "visible")))
        .groupBy(sql`round((${resenas.puntualidad} + ${resenas.calidad} + ${resenas.calidadPrecio} + ${resenas.cumplimiento}) / 4.0)`),
    ]);

  const distribucion = [0, 0, 0, 0, 0];
  for (const c of conteo) {
    const i = Math.min(5, Math.max(1, Math.round(Number(c.estrellas)))) - 1;
    distribucion[i] = (distribucion[i] ?? 0) + Number(c.total);
  }

  const categoriaPrincipal = cats[0]?.nombre ?? null;
  const localidadPrincipal = locs[0]?.nombre ?? null;

  const promedio = Number(p.promedio ?? 0);
  const totalResenas = p.totalResenas;
  const estrellasPromedio = totalResenas > 0 ? Math.round(promedio * 2) / 2 : 0;

  return {
    tipo: "publicado",
    proveedor: {
      slug: p.slug,
      nombre: p.nombre,
      presentacion: p.presentacion,
      whatsapp: p.whatsapp,
      categoriaPrincipal,
      localidadPrincipal,
      servicios: servicios.map((s) => ({
        nombre: s.nombre,
        descripcion: s.descripcion,
        precioDesde: s.precioDesde?.toString() ?? null,
        unidad: s.unidad,
      })),
      fotos: fotos.map((f) => ({
        id: f.id,
        ruta: f.ruta,
        rutaMiniatura: f.rutaMiniatura ?? f.ruta,
        descripcion: f.descripcion,
      })),
      insignias: filasInsignias.map((i) => ({
        clave: i.clave,
        nombre: i.nombre,
      })),
      resenas: filasResenas.map((r) => ({
        nombreCliente: r.nombreCliente ?? "Cliente",
        estrellas: Math.round(Number(r.estrellas ?? 0)),
        comentario: r.comentario,
        creadoEn: r.creadoEn,
        respuesta: r.respuesta,
      })),
      promedio: estrellasPromedio,
      totalResenas,
      categorias: cats.map((c) => c.nombre),
      localidades: locs.map((l) => l.nombre),
      desde: p.desde,
      distribucion,
      enlaces: cats.flatMap((c) => [{ texto: ` en Bogotá`, ruta: `/servicios/${c.slug}` }, ...locs.slice(0, 3).map((l) => ({ texto: ` en ${l.nombre}`, ruta: `/servicios/${c.slug}/${l.slug}` }))]),
    },
  };
}

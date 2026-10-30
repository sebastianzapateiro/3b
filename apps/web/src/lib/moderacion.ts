/**
 * B3 · Moderación de contenido (CU-23, CU-60, CU-61). Cola de reportes agrupados por contenido,
 * detalle y aplicación de decisiones. Una reseña no se oculta por ser negativa.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema, consultar } from "@las3b/db";
import { recalcularReputacion } from "@/lib/resenas";

const { reportes, resenas, respuestasResena, portafolioFotos, serviciosProveedor, proveedores, user } = schema;
const filas = <T,>(r: unknown) => r as T[];

export const TIPOS_COLA = ["todo", "resena", "foto", "servicio", "slug", "perfil", "enlace"] as const;
export type TipoCola = (typeof TIPOS_COLA)[number];
export const ETIQUETA_TIPO: Record<string, string> = { resena: "Reseña", respuesta: "Respuesta", foto: "Foto", servicio: "Servicio", slug: "URL", perfil: "Perfil", enlace: "Solicitud de retiro" };

export const MOTIVOS_MODERACION = [
  "Lenguaje ofensivo",
  "Datos personales",
  "Spam o publicidad",
  "No relacionado con el servicio",
  "Suplantación",
  "Contenido sexual",
  "Menores identificables",
  "Foto no propia",
  "Ofrece servicios no permitidos (transporte de personas, salud o cuidado de personas)",
  "Reporte sin fundamento: se mantiene",
] as const;

export type ItemCola = { tipo: string; objetoId: string; reportes: number; primero: Date; motivos: string[]; titulo: string; sobre: string; oculto: boolean };

const esEnlace = (id: string) => /^https?:\/\//i.test(id);

/** Reportes sin resolver, agrupados por contenido y ordenados por número de reportes y antigüedad. */
export async function colaModeracion(tipo: TipoCola): Promise<ItemCola[]> {
  const grupos = filas<{ tipo: string; objeto_id: string; n: number; primero: Date; motivos: string[] }>(
    await consultar(sql`
      SELECT tipo_objeto::text AS tipo, objeto_id, count(*)::int AS n, min(created_at) AS primero, array_agg(DISTINCT motivo) AS motivos
      FROM reportes WHERE NOT resuelto GROUP BY 1, 2 ORDER BY n DESC, primero ASC LIMIT 100`),
  );
  const items: ItemCola[] = [];
  for (const g of grupos) {
    const t = esEnlace(g.objeto_id) ? "enlace" : g.tipo;
    if (tipo !== "todo" && tipo !== t) continue;
    const info = await resumen(g.tipo, g.objeto_id);
    items.push({ tipo: g.tipo, objetoId: g.objeto_id, reportes: g.n, primero: g.primero, motivos: g.motivos.map((m) => m.replace(/^retiro:/, "")), ...info });
  }
  return items;
}

async function resumen(tipo: string, id: string): Promise<{ titulo: string; sobre: string; oculto: boolean }> {
  if (esEnlace(id)) return { titulo: id, sobre: "Solicitud de retiro de contenido", oculto: false };
  try {
    if (tipo === "resena") {
      const [r] = await db.select({ c: resenas.comentario, e: resenas.estado, p: proveedores.nombrePublico }).from(resenas).innerJoin(proveedores, eq(proveedores.id, resenas.proveedorId)).where(eq(resenas.id, id)).limit(1);
      return { titulo: r?.c ? `«${r.c.slice(0, 120)}»` : "Reseña sin comentario", sobre: `Sobre ${r?.p ?? "—"}`, oculto: r?.e !== "visible" };
    }
    if (tipo === "respuesta") {
      const [r] = await db.select({ t: respuestasResena.texto, e: respuestasResena.estado }).from(respuestasResena).where(eq(respuestasResena.resenaId, id)).limit(1);
      return { titulo: r ? `«${r.t.slice(0, 120)}»` : "Respuesta", sobre: "Respuesta de un proveedor", oculto: r?.e !== "visible" };
    }
    if (tipo === "foto") {
      const [r] = await db.select({ e: portafolioFotos.estado, p: proveedores.nombrePublico }).from(portafolioFotos).innerJoin(proveedores, eq(proveedores.id, portafolioFotos.proveedorId)).where(eq(portafolioFotos.id, id)).limit(1);
      return { titulo: `Galería de ${r?.p ?? "—"}`, sobre: "Foto de trabajo", oculto: r?.e !== "visible" };
    }
    if (tipo === "servicio") {
      const [r] = await db.select({ n: serviciosProveedor.nombre, v: serviciosProveedor.visible, p: proveedores.nombrePublico }).from(serviciosProveedor).innerJoin(proveedores, eq(proveedores.id, serviciosProveedor.proveedorId)).where(eq(serviciosProveedor.id, Number(id))).limit(1);
      return { titulo: `«${r?.n ?? "—"}»`, sobre: `Servicio de ${r?.p ?? "—"}`, oculto: r?.v === false };
    }
    const [p] = await db.select({ n: proveedores.nombrePublico, s: proveedores.slug, e: proveedores.estado }).from(proveedores).where(sql`${proveedores.slug} = ${id} OR ${proveedores.id}::text = ${id}`).limit(1);
    return { titulo: tipo === "slug" ? `lastresb.com.co/${p?.s ?? id}` : (p?.n ?? id), sobre: tipo === "slug" ? "Dirección de página" : "Perfil de proveedor", oculto: p ? p.e !== "aprobado" && p.e !== "en_revision" : false };
  } catch {
    return { titulo: id, sobre: ETIQUETA_TIPO[tipo] ?? tipo, oculto: false };
  }
}

export async function detalleModeracion(tipo: string, id: string) {
  const reps = await db
    .select({ motivo: reportes.motivo, detalle: reportes.detalle, creado: reportes.createdAt, reportante: user.name })
    .from(reportes)
    .leftJoin(user, eq(user.id, reportes.reportanteId))
    .where(and(eq(reportes.tipoObjeto, tipo as never), eq(reportes.objetoId, id), eq(reportes.resuelto, false)))
    .orderBy(desc(reportes.createdAt));

  let contenido: { cliente?: string; proveedor?: string; slug?: string; fecha?: Date; notas?: number[]; texto?: string | null; respuesta?: string | null; verificada?: boolean; estado?: string } | null = null;
  if (tipo === "resena" && !esEnlace(id)) {
    const [r] = await db
      .select({ cliente: user.name, proveedor: proveedores.nombrePublico, slug: proveedores.slug, fecha: resenas.createdAt, a: resenas.puntualidad, b: resenas.calidad, c: resenas.calidadPrecio, d: resenas.cumplimiento, texto: resenas.comentario, estado: resenas.estado, verificada: resenas.verificada, respuesta: respuestasResena.texto })
      .from(resenas)
      .innerJoin(user, eq(user.id, resenas.compradorId))
      .innerJoin(proveedores, eq(proveedores.id, resenas.proveedorId))
      .leftJoin(respuestasResena, eq(respuestasResena.resenaId, resenas.id))
      .where(eq(resenas.id, id))
      .limit(1);
    if (r) contenido = { cliente: r.cliente, proveedor: r.proveedor, slug: r.slug, fecha: r.fecha, notas: [r.a, r.b, r.c, r.d], texto: r.texto, respuesta: r.respuesta, estado: r.estado, verificada: r.verificada };
  }
  const antes = filas<{ n: number }>(await consultar(sql`SELECT count(*)::int AS n FROM acciones_moderacion WHERE tipo_objeto::text = ${tipo} AND objeto_id = ${id}`));
  return { reportes: reps, contenido, accionesPrevias: antes[0]?.n ?? 0 };
}

export type Decision = "mantener" | "ocultar" | "eliminar";

/** Aplica la decisión al contenido, resuelve sus reportes y devuelve el id del proveedor afectado (si aplica). */
export async function aplicarDecision(tipo: string, id: string, decision: Decision): Promise<string | null> {
  const estado = decision === "mantener" ? "visible" : decision === "ocultar" ? "oculto" : "eliminado";
  let proveedorId: string | null = null;

  if (tipo === "resena" && !esEnlace(id)) {
    const [r] = await db.update(resenas).set({ estado }).where(eq(resenas.id, id)).returning({ p: resenas.proveedorId });
    proveedorId = r?.p ?? null;
    if (proveedorId) await recalcularReputacion(proveedorId);
  } else if (tipo === "respuesta") {
    await db.update(respuestasResena).set({ estado }).where(eq(respuestasResena.resenaId, id));
    const [r] = await db.select({ p: resenas.proveedorId }).from(resenas).where(eq(resenas.id, id)).limit(1);
    proveedorId = r?.p ?? null;
  } else if (tipo === "foto") {
    const [r] = await db.update(portafolioFotos).set({ estado }).where(eq(portafolioFotos.id, id)).returning({ p: portafolioFotos.proveedorId });
    proveedorId = r?.p ?? null;
  } else if (tipo === "servicio") {
    const [r] = await db.update(serviciosProveedor).set({ visible: decision === "mantener" }).where(eq(serviciosProveedor.id, Number(id))).returning({ p: serviciosProveedor.proveedorId });
    proveedorId = r?.p ?? null;
  } else if ((tipo === "perfil" || tipo === "slug") && !esEnlace(id)) {
    const [p] = await db.select({ id: proveedores.id, estado: proveedores.estado }).from(proveedores).where(sql`${proveedores.slug} = ${id} OR ${proveedores.id}::text = ${id}`).limit(1);
    if (p) {
      proveedorId = p.id;
      const nuevo = decision === "ocultar" ? "pausado" : decision === "eliminar" ? "suspendido" : p.estado === "pausado" ? "aprobado" : p.estado;
      await db.update(proveedores).set({ estado: nuevo, updatedAt: new Date() }).where(eq(proveedores.id, p.id));
    }
  }

  await db.update(reportes).set({ resuelto: true }).where(and(eq(reportes.tipoObjeto, tipo as never), eq(reportes.objetoId, id)));
  return proveedorId;
}

/** Tres contenidos ocultos en la ventana de reputación pasan el perfil del proveedor a «en revisión». */
export async function revisarReincidencia(proveedorId: string, ventanaDias: number, umbral = 3) {
  const [r] = filas<{ n: number }>(
    await consultar(sql`SELECT count(*)::int AS n FROM auditoria WHERE accion IN ('moderacion_ocultar','moderacion_eliminar') AND metadatos->>'proveedorId' = ${proveedorId} AND created_at >= now() - make_interval(days => ${ventanaDias})`),
  );
  if ((r?.n ?? 0) >= umbral) {
    await db.update(proveedores).set({ estado: "en_revision", updatedAt: new Date() }).where(and(eq(proveedores.id, proveedorId), eq(proveedores.estado, "aprobado")));
    return true;
  }
  return false;
}


/**
 * P6 · Mi cuenta: sesión del comprador, actividad (contactos y reseñas) y solicitudes de datos (Ley 1581).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { sumarDiasHabilesColombia } from "@las3b/shared";
import { auth } from "@/lib/auth";

const { contactos, resenas, proveedores, categorias, solicitudesDatos, consentimientos, politicas, festivos, configuracion } = schema;

/** Exige sesión; si no hay, lleva a ingresar y regresa a la misma página. */
export async function exigirUsuario(destino: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/ingresar?${new URLSearchParams({ destino })}`);
  return session.user;
}

export async function actividadDelUsuario(usuarioId: string) {
  const [misContactos, misResenas] = await Promise.all([
    db
      .select({
        id: contactos.id,
        fecha: contactos.createdAt,
        slug: proveedores.slug,
        proveedor: proveedores.nombrePublico,
        servicio: categorias.nombre,
        resenaId: resenas.id,
      })
      .from(contactos)
      .innerJoin(proveedores, eq(proveedores.id, contactos.proveedorId))
      .leftJoin(categorias, eq(categorias.id, contactos.categoriaId))
      .leftJoin(resenas, eq(resenas.contactoId, contactos.id))
      .where(eq(contactos.compradorId, usuarioId))
      .orderBy(desc(contactos.createdAt))
      .limit(30),
    db
      .select({
        id: resenas.id,
        fecha: resenas.createdAt,
        slug: proveedores.slug,
        proveedor: proveedores.nombrePublico,
        comentario: resenas.comentario,
        estado: resenas.estado,
        puntualidad: resenas.puntualidad,
        calidad: resenas.calidad,
        calidadPrecio: resenas.calidadPrecio,
        cumplimiento: resenas.cumplimiento,
      })
      .from(resenas)
      .innerJoin(proveedores, eq(proveedores.id, resenas.proveedorId))
      .where(eq(resenas.compradorId, usuarioId))
      .orderBy(desc(resenas.createdAt))
      .limit(30),
  ]);
  return { contactos: misContactos, resenas: misResenas };
}

export async function datosPrivacidad(usuarioId: string) {
  const [solicitudes, aceptadas] = await Promise.all([
    db.select().from(solicitudesDatos).where(eq(solicitudesDatos.usuarioId, usuarioId)).orderBy(desc(solicitudesDatos.createdAt)),
    db
      .select({ tipo: politicas.tipo, version: politicas.version, fecha: consentimientos.aceptadoEn })
      .from(consentimientos)
      .innerJoin(politicas, eq(politicas.id, consentimientos.politicaId))
      .where(eq(consentimientos.usuarioId, usuarioId))
      .orderBy(desc(consentimientos.aceptadoEn)),
  ]);
  return { solicitudes, aceptadas };
}

/** CU-92: suma días hábiles con los festivos de Colombia (calculados) y los que se agreguen a mano en la tabla `festivos`. */
export async function sumarDiasHabiles(desde: Date, dias: number): Promise<string> {
  const extra = new Set((await db.select({ fecha: festivos.fecha }).from(festivos)).map((f) => String(f.fecha)));
  return sumarDiasHabilesColombia(desde, dias, extra);
}

/** Plazos en días hábiles: parámetros de `configuracion` (regla 8). Ley 1581: consultas 10, reclamos 15. */
export async function plazoSolicitud(tipo: "consulta" | "rectificacion" | "supresion" | "exportacion") {
  const clave = tipo === "consulta" ? "plazo_consulta_dias_habiles" : "plazo_reclamo_dias_habiles";
  const [c] = await db.select({ valor: configuracion.valor }).from(configuracion).where(eq(configuracion.clave, clave)).limit(1);
  const n = Number(c?.valor);
  return Number.isFinite(n) && n > 0 ? n : tipo === "consulta" ? 10 : 15;
}

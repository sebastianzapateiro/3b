/**
 * P5 / P8 / B7 · «Servicio prestado» (CU-38) y solicitud automática de calificación.
 * El proveedor marca el servicio desde su panel: se crea el código, la reseña de ese contacto queda «verificada» y al comprador
 * se le pide que califique. Con cuenta y correo sale por correo en el acto; sin cuenta (viene del buscador del inicio) queda en la
 * cola del administrador, que lo envía por WhatsApp hasta que se contrate la API de WhatsApp.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { enviarCorreo } from "@/lib/correo";
import { enlaceCalificar, generarCodigo, mensajeCalificacion } from "@/lib/calificacion";
import { esCorreoFicticio } from "@/lib/invitaciones";
import { SITIO_URL } from "@/lib/seo";

const { contactos, servicios, resenas, solicitudesServicio, categorias, proveedores, user } = schema;

/** Contactos recientes del proveedor y en qué paso va cada uno. Nunca muestra el WhatsApp del cliente. */
export async function contactosDelProveedor(proveedorId: string, limite = 50) {
  const filas = await db
    .select({
      id: contactos.id, cuando: contactos.createdAt, origen: contactos.origen,
      cliente: sql<string | null>`coalesce(${solicitudesServicio.nombre}, ${user.name})`,
      categoria: categorias.nombre, solicitud: solicitudesServicio.textoLibre,
      codigo: servicios.codigo, prestadoEn: servicios.fechaLlegada, resenaId: resenas.id,
    })
    .from(contactos)
    .leftJoin(solicitudesServicio, eq(solicitudesServicio.id, contactos.solicitudId))
    .leftJoin(user, eq(user.id, contactos.compradorId))
    .leftJoin(categorias, eq(categorias.id, contactos.categoriaId))
    .leftJoin(servicios, eq(servicios.contactoId, contactos.id))
    .leftJoin(resenas, eq(resenas.contactoId, contactos.id))
    .where(eq(contactos.proveedorId, proveedorId))
    .orderBy(desc(contactos.createdAt))
    .limit(limite);
  return filas.map((f) => ({ ...f, estado: f.resenaId ? ("calificado" as const) : f.codigo ? ("prestado" as const) : ("contactado" as const) }));
}

/** Marca el servicio como prestado (una sola vez por contacto) y pide la calificación. */
export async function marcarServicioPrestado(proveedorId: string, contactoId: string): Promise<{ ok: true; enviado: "correo" | "pendiente" } | { error: string }> {
  const [c] = await db
    .select({ id: contactos.id, compradorId: contactos.compradorId, solicitudNombre: solicitudesServicio.nombre, slug: proveedores.slug, proveedor: proveedores.nombrePublico })
    .from(contactos)
    .innerJoin(proveedores, eq(proveedores.id, contactos.proveedorId))
    .leftJoin(solicitudesServicio, eq(solicitudesServicio.id, contactos.solicitudId))
    .where(and(eq(contactos.id, contactoId), eq(contactos.proveedorId, proveedorId)))
    .limit(1);
  if (!c) return { error: "Ese contacto no es de tu perfil." };

  const [existente] = await db.select({ id: servicios.id }).from(servicios).where(eq(servicios.contactoId, contactoId)).limit(1);
  if (existente) return { error: "Ya marcaste este servicio como prestado." };

  let codigo = "";
  for (let intento = 0; intento < 5 && !codigo; intento++) {
    const candidato = generarCodigo();
    const [uso] = await db.select({ id: servicios.id }).from(servicios).where(eq(servicios.codigo, candidato)).limit(1);
    if (!uso) codigo = candidato;
  }
  if (!codigo) return { error: "No pudimos generar el código. Intenta de nuevo." };

  const [servicio] = await db.insert(servicios).values({ contactoId, codigo }).returning({ id: servicios.id });

  // Con cuenta y correo real, el aviso sale ahora; si no, queda en la cola del administrador (WhatsApp manual).
  const [comprador] = c.compradorId ? await db.select({ nombre: user.name, correo: user.email }).from(user).where(eq(user.id, c.compradorId)).limit(1) : [];
  if (comprador && !esCorreoFicticio(comprador.correo)) {
    const enlace = enlaceCalificar(SITIO_URL, c.slug, codigo);
    await enviarCorreo({ para: comprador.correo, asunto: `¿Cómo te fue con ${c.proveedor}?`, texto: mensajeCalificacion({ cliente: comprador.nombre, proveedor: c.proveedor, enlace }) });
    await db.update(servicios).set({ calificacionEnviadaEn: new Date(), calificacionCanal: "correo" }).where(eq(servicios.id, servicio!.id));
    return { ok: true, enviado: "correo" };
  }
  return { ok: true, enviado: "pendiente" };
}

/** B7 · Calificaciones por enviar por WhatsApp: servicios prestados sin aviso y sin reseña, con el número de la solicitud. */
export async function calificacionesPorEnviar() {
  const filas = await db
    .select({
      servicioId: servicios.id, codigo: servicios.codigo, prestadoEn: servicios.fechaLlegada,
      cliente: solicitudesServicio.nombre, whatsapp: solicitudesServicio.whatsapp, slug: proveedores.slug, proveedor: proveedores.nombrePublico,
    })
    .from(servicios)
    .innerJoin(contactos, eq(contactos.id, servicios.contactoId))
    .innerJoin(proveedores, eq(proveedores.id, contactos.proveedorId))
    .leftJoin(solicitudesServicio, eq(solicitudesServicio.id, contactos.solicitudId))
    .leftJoin(resenas, eq(resenas.contactoId, contactos.id))
    .where(and(isNull(servicios.calificacionEnviadaEn), isNull(resenas.id)))
    .orderBy(servicios.fechaLlegada);
  return filas.map((f) => ({ ...f, mensaje: mensajeCalificacion({ cliente: f.cliente, proveedor: f.proveedor, enlace: enlaceCalificar(SITIO_URL, f.slug, f.codigo) }) }));
}

export async function marcarCalificacionEnviada(servicioId: string, canal: "whatsapp") {
  await db.update(servicios).set({ calificacionEnviadaEn: new Date(), calificacionCanal: canal }).where(eq(servicios.id, servicioId));
}

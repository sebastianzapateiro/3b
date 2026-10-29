"use server";

/**
 * B1, B2, B4, B5 · Acciones del backoffice (Server Actions). Cada una exige sesión + rol + 2FA,
 * valida la entrada con zod y deja registro en `auditoria` (regla 3).
 */
import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { slugSchema } from "@las3b/shared";
import { db, protegerDocumento, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { auth } from "@/lib/auth";
import { enviarCorreo } from "@/lib/correo";
import { MOTIVOS_RECHAZO as MOTIVOS } from "@/lib/motivos-rechazo";
import { parametro } from "@/lib/parametros";
import { exigirBackoffice } from "@/lib/verificacion";

const { proveedores, usuarioRoles, user, session, twoFactor, categorias, terminosBusqueda, proveedorInsignias, insignias, proveedorCategorias, proveedorLocalidades, serviciosProveedor, configuracion } = schema;

const uuid = z.string().uuid();
const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function volver(ruta: string, params: Record<string, string>): never {
  redirect(`${ruta}?${new URLSearchParams(params)}`);
}

/** Plazo de RUT en días: parámetro de `configuracion` (regla 8), 30 por defecto. */
async function plazoRutDias() {
  const [c] = await db.select({ valor: configuracion.valor }).from(configuracion).where(eq(configuracion.clave, "plazo_rut_dias")).limit(1);
  const n = Number(c?.valor);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

/* ───────────── Aprobación ───────────── */

export async function aprobarProveedor(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const [p] = await db.select({ segmento: proveedores.segmento, estado: proveedores.estado }).from(proveedores).where(eq(proveedores.id, id)).limit(1);
  if (!p) volver("/admin/aprobaciones", { error: "Proveedor no encontrado." });

  const limite = p.segmento === "independiente_sin_rut" ? new Date(Date.now() + (await plazoRutDias()) * 86_400_000).toISOString().slice(0, 10) : null;
  await db
    .update(proveedores)
    .set({ estado: "aprobado", aprobadoEn: new Date(), updatedAt: new Date(), motivoRechazo: null, ...(limite ? { rutFechaLimite: limite } : {}) })
    .where(eq(proveedores.id, id));

  // Insignia «Verificado» automática al aprobar.
  const [verificado] = await db.select({ id: insignias.id }).from(insignias).where(eq(insignias.clave, "verificado")).limit(1);
  if (verificado) {
    await db.insert(proveedorInsignias).values({ proveedorId: id, insigniaId: verificado.id, otorgadaPor: actor.user.id }).onConflictDoNothing();
  }

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "proveedor_aprobado", objetoTipo: "proveedor", objetoId: id });
  revalidatePath("/admin", "layout");
  volver("/admin/aprobaciones", { ok: "Proveedor aprobado y publicado." });
}



export async function rechazarProveedor(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const motivo = z.enum(MOTIVOS).parse(texto(formData, "motivo"));
  const mensaje = texto(formData, "mensaje");
  if (motivo.startsWith("Otro") && !mensaje) volver(`/admin/proveedores/${id}`, { error: "Explica el motivo en el mensaje al proveedor." });

  await db
    .update(proveedores)
    .set({ estado: "rechazado", motivoRechazo: mensaje ? `${motivo}: ${mensaje}` : motivo, updatedAt: new Date() })
    .where(eq(proveedores.id, id));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "proveedor_rechazado", objetoTipo: "proveedor", objetoId: id, motivo: `${motivo}${mensaje ? `: ${mensaje}` : ""}` });
  revalidatePath("/admin", "layout");
  volver("/admin/aprobaciones", { ok: "Proveedor rechazado. Quedó el motivo registrado." });
}

/* ───────────── Alta asistida ───────────── */

const altaAsistida = z.object({
  tipo: z.enum(["independiente", "empresa"]),
  rut: z.enum(["si", "no"]),
  factura: z.enum(["si", "no"]),
  nombreLegal: z.string().min(3, "Escribe el nombre completo o la razón social."),
  nombrePublico: z.string().min(3, "Escribe el nombre público."),
  tipoDocumento: z.enum(["cc", "ce", "ppt", "nit"]),
  documento: z.string().regex(/^\d{5,15}$/, "El número de documento va sin puntos ni espacios."),
  fechaNacimiento: z.string().optional(),
  whatsapp: z.string().transform((v) => v.replace(/[^\d+]/g, "")).pipe(z.string().regex(/^\+?\d{10,13}$/, "Revisa el WhatsApp.")),
  correo: z.string().email("Revisa el correo.").optional().or(z.literal("")),
  direccion: z.string().min(5, "Escribe la dirección de notificaciones."),
  presentacion: z.string().max(280, "La presentación admite hasta 280 caracteres.").optional(),
  servicio: z.string().optional(),
  precio: z.string().optional(),
  unidad: z.enum(["visita", "hora", "clase", "trabajo"]).default("visita"),
  slug: slugSchema,
  origen: z.string().default("En persona"),
});

export async function crearProveedorAsistido(formData: FormData) {
  const actor = await exigirBackoffice();
  const crudo = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const r = altaAsistida.safeParse(crudo);
  if (!r.success) volver("/admin/proveedores/nuevo", { error: r.error.issues[0]?.message ?? "Revisa los datos." });
  const d = r.data;

  const categoriaIds = formData.getAll("categoria").map(Number).filter(Number.isInteger);
  const localidadIds = formData.getAll("localidad").map(Number).filter(Number.isInteger);
  if (categoriaIds.length === 0) volver("/admin/proveedores/nuevo", { error: "Elige al menos una categoría." });
  if (localidadIds.length === 0) volver("/admin/proveedores/nuevo", { error: "Elige al menos una localidad." });

  const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, d.slug)).limit(1);
  if (existe) volver("/admin/proveedores/nuevo", { error: "Esa dirección de página ya está en uso." });

  const segmento = d.tipo === "empresa" ? "empresa" : d.rut === "si" ? "independiente_con_rut" : "independiente_sin_rut";
  const usuarioId = randomUUID();
  const correo = d.correo || `${usuarioId}@sin-correo.lastresb.invalid`;

  // El proveedor confirma WhatsApp, acepta términos y crea su clave desde su propia invitación (Ley 1581):
  // aquí solo queda el borrador a su nombre.
  await db.insert(user).values({ id: usuarioId, name: d.nombreLegal, email: correo, emailVerified: false, telefono: d.whatsapp });
  const [nuevo] = await db
    .insert(proveedores)
    .values({
      usuarioId,
      estado: "borrador",
      segmento,
      nombrePublico: d.nombrePublico,
      slug: d.slug,
      presentacion: d.presentacion || null,
      whatsapp: d.whatsapp,
      emiteFactura: d.factura === "si",
      tipoDocumento: d.tipoDocumento,
      ...protegerDocumento(d.documento),
      direccionNotificaciones: d.direccion,
      fechaNacimiento: d.fechaNacimiento || null,
    })
    .returning({ id: proveedores.id });
  const id = nuevo!.id;

  await db.insert(usuarioRoles).values({ usuarioId, rol: "proveedor", asignadoPor: actor.user.id });
  await db.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: id, categoriaId })));
  await db.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: id, localidadId })));
  if (d.servicio) {
    await db.insert(serviciosProveedor).values({ proveedorId: id, categoriaId: categoriaIds[0], nombre: d.servicio, precioDesde: d.precio?.replace(/\D/g, "") || null, unidad: d.unidad });
  }

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "alta_asistida", objetoTipo: "proveedor", objetoId: id, metadatos: { origen: d.origen } });
  revalidatePath("/admin", "layout");
  volver("/admin/proveedores/nuevo", { ok: `Borrador de ${d.nombrePublico} creado.` });
}

/* ───────────── Usuarios y roles ───────────── */

const ROLES = ["comprador", "proveedor", "verificador", "moderador", "admin"] as const;

/**
 * CU-72 · Crear usuario desde el backoffice (solo admin). La cuenta nace sin clave: la persona recibe
 * un enlace de invitación a /nueva-clave (token de Better Auth, vigencia en `configuracion`).
 * Al primer ingreso el proxy le pide mayoría de edad y aceptar políticas (regla 5).
 */
export async function crearUsuario(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const datos = z
    .object({ nombre: z.string().min(2).max(80), correo: z.string().email().max(120), roles: z.array(z.enum(ROLES)) })
    .safeParse({ nombre: texto(formData, "nombre"), correo: texto(formData, "correo").toLowerCase(), roles: formData.getAll("rol") });
  if (!datos.success) volver("/admin/usuarios", { nuevo: "1", error: "Revisa el nombre y el correo." });
  const { nombre, correo, roles } = datos.data;

  const [existe] = await db.select({ id: user.id }).from(user).where(eq(user.email, correo)).limit(1);
  if (existe) volver("/admin/usuarios", { u: existe.id, error: "Ya hay una cuenta con ese correo." });

  const ctx = await auth.$context;
  // El admin responde por el correo; el enlace de invitación solo llega a ese buzón.
  const nuevo = await ctx.internalAdapter.createUser({ name: nombre, email: correo, emailVerified: true }, { method: "admin" });
  if (roles.length) await db.insert(usuarioRoles).values(roles.map((rol) => ({ usuarioId: nuevo.id, rol, asignadoPor: actor.user.id })));

  const token = randomBytes(24).toString("base64url");
  const horas = await parametro("invitacion_vigencia_h");
  await ctx.internalAdapter.createVerificationValue({ identifier: `reset-password:${token}`, value: nuevo.id, expiresAt: new Date(Date.now() + horas * 3_600_000) });
  await enviarCorreo({
    para: correo,
    asunto: "Te crearon una cuenta en LasTresB",
    texto: `Hola, ${nombre}. El equipo de LasTresB te creó una cuenta con este correo.\nPara elegir tu clave abre este enlace (vence en ${horas} horas):\n${ctx.baseURL.replace(/\/api\/auth$/, "")}/nueva-clave?token=${token}\n\nSi no esperabas este correo, ignóralo.`,
  });

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "usuario_creado", objetoTipo: "usuario", objetoId: nuevo.id, metadatos: { roles } });
  revalidatePath("/admin", "layout");
  volver("/admin/usuarios", { u: nuevo.id, ok: `Cuenta creada. Enviamos la invitación a ${correo}.` });
}

export async function guardarRoles(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const usuarioId = z.string().min(1).parse(texto(formData, "usuarioId"));
  const nuevos = z.array(z.enum(ROLES)).parse(formData.getAll("rol"));

  const actuales = (await db.select({ rol: usuarioRoles.rol }).from(usuarioRoles).where(eq(usuarioRoles.usuarioId, usuarioId))).map((r) => r.rol as string);
  if (actuales.includes("admin") && !nuevos.includes("admin")) {
    const [otros] = await db.select({ n: sql<number>`count(*)::int` }).from(usuarioRoles).where(and(eq(usuarioRoles.rol, "admin"), sql`${usuarioRoles.usuarioId} <> ${usuarioId}`));
    if ((otros?.n ?? 0) === 0) volver("/admin/usuarios", { u: usuarioId, error: "Es el último administrador: no puede quitarse el rol." });
  }

  await db.delete(usuarioRoles).where(eq(usuarioRoles.usuarioId, usuarioId));
  if (nuevos.length) await db.insert(usuarioRoles).values(nuevos.map((rol) => ({ usuarioId, rol, asignadoPor: actor.user.id })));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "roles_actualizados", objetoTipo: "usuario", objetoId: usuarioId, metadatos: { antes: actuales, despues: nuevos } });
  volver("/admin/usuarios", { u: usuarioId, ok: "Roles guardados." });
}

export async function suspenderUsuario(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const usuarioId = z.string().min(1).parse(texto(formData, "usuarioId"));
  const tipo = z.enum(["aviso", "provisional"]).parse(texto(formData, "tipo"));
  const detalle = texto(formData, "motivo");
  const predefinido = texto(formData, "predefinido");
  const motivo = [predefinido, detalle].filter(Boolean).join(": ");
  if (motivo.length < 5) volver("/admin/usuarios", { u: usuarioId, error: "Escribe el motivo." });
  if (usuarioId === actor.user.id) volver("/admin/usuarios", { u: usuarioId, error: "No puedes suspender tu propia cuenta." });

  if (tipo === "aviso") {
    // Descargos: 5 días hábiles. El envío del aviso por correo queda pendiente del proveedor de correo.
    await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "aviso_suspension", objetoTipo: "usuario", objetoId: usuarioId, motivo });
    volver("/admin/usuarios", { u: usuarioId, ok: "Aviso registrado. La persona tiene 5 días hábiles para dar su versión." });
  }

  const hasta = texto(formData, "duracion") === "indefinida" ? new Date("9999-12-31") : new Date(texto(formData, "hasta") || Date.now() + 30 * 86_400_000);
  await db.update(user).set({ suspendidoHasta: hasta, updatedAt: new Date() }).where(eq(user.id, usuarioId));
  await db.delete(session).where(eq(session.userId, usuarioId));
  await db.update(proveedores).set({ estado: "suspendido", updatedAt: new Date() }).where(eq(proveedores.usuarioId, usuarioId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "usuario_suspendido", objetoTipo: "usuario", objetoId: usuarioId, motivo });
  revalidatePath("/admin", "layout");
  volver("/admin/usuarios", { u: usuarioId, ok: "Cuenta suspendida y sesiones cerradas." });
}

export async function restablecerDosFactor(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const usuarioId = z.string().min(1).parse(texto(formData, "usuarioId"));
  await db.delete(twoFactor).where(eq(twoFactor.userId, usuarioId));
  await db.update(user).set({ twoFactorEnabled: false, updatedAt: new Date() }).where(eq(user.id, usuarioId));
  await db.delete(session).where(eq(session.userId, usuarioId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "dos_factor_restablecido", objetoTipo: "usuario", objetoId: usuarioId });
  volver("/admin/usuarios", { u: usuarioId, ok: "2FA restablecido. Deberá configurarlo de nuevo." });
}

/* ───────────── Catálogo ───────────── */

export async function guardarCategoria(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const id = z.coerce.number().int().parse(texto(formData, "id"));
  const slug = slugSchema.safeParse(texto(formData, "slug"));
  const nombre = texto(formData, "nombre");
  if (!slug.success || nombre.length < 2) volver("/admin/catalogo", { c: String(id), error: "Revisa el nombre y el slug." });
  const [choque] = await db.select({ id: categorias.id }).from(categorias).where(and(eq(categorias.slug, slug.data), sql`${categorias.id} <> ${id}`)).limit(1);
  if (choque) volver("/admin/catalogo", { c: String(id), error: "Ese slug ya lo usa otra categoría." });

  await db
    .update(categorias)
    .set({
      nombre,
      slug: slug.data,
      padreId: Number(texto(formData, "padreId")) || null,
      exigeInsigniaMenores: formData.has("menores"),
      exigeRutDesdeAlta: formData.has("rut"),
      exigeMatricula: formData.has("matricula"),
      activa: formData.has("activa"),
    })
    .where(eq(categorias.id, id));

  const terminos = [...new Set(texto(formData, "terminos").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
  await db.delete(terminosBusqueda).where(eq(terminosBusqueda.categoriaId, id));
  if (terminos.length) await db.insert(terminosBusqueda).values(terminos.map((termino) => ({ termino, categoriaId: id })));

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "categoria_actualizada", objetoTipo: "categoria", objetoId: String(id) });
  revalidatePath("/categorias");
  volver("/admin/catalogo", { c: String(id), ok: "Categoría guardada." });
}

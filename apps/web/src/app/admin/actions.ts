"use server";

/**
 * B1, B2, B4, B5 · Acciones del backoffice (Server Actions). Cada una exige sesión + rol + 2FA,
 * valida la entrada con zod y deja registro en `auditoria` (regla 3).
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { slugSchema } from "@las3b/shared";
import { db, protegerDocumento, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { auth } from "@/lib/auth";
import { asignarClave, CLAVE_MAX, CLAVE_MIN } from "@/lib/claves";
import { MOTIVOS_RECHAZO as MOTIVOS } from "@/lib/motivos-rechazo";
import { crearInvitacion, enviarInvitacionPorCorreo, esCorreoFicticio } from "@/lib/invitaciones";
import { guardarCompletitud } from "@/lib/completitud";
import { categoriasSinPrecio, oficioDelServicio } from "@/lib/precios";
import { hoyBogota, VALORES_FUENTE } from "@/lib/seguimiento";
import { exigencia2fa, exigirBackoffice, guardarExigencia2fa, ROLES_2FA_OPCIONAL } from "@/lib/verificacion";

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
  fuente: z.enum(VALORES_FUENTE).optional().or(z.literal("").transform(() => undefined)),
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
  // Con el correo el proveedor ingresa después de crear su clave: sin él la invitación no le sirve.
  const invitar = texto(formData, "accion") === "invitar";
  if (invitar && !d.correo) volver("/admin/proveedores/nuevo", { error: "Para enviar la invitación el proveedor necesita un correo: con él ingresará. Agrégalo o guarda solo el borrador." });

  const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, d.slug)).limit(1);
  if (existe) volver("/admin/proveedores/nuevo", { error: "Esa dirección de página ya está en uso." });
  if (d.correo) {
    const [cuenta] = await db.select({ id: user.id }).from(user).where(eq(user.email, d.correo.toLowerCase())).limit(1);
    if (cuenta) volver("/admin/proveedores/nuevo", { error: "Ya hay una cuenta con ese correo. Si es la misma persona, que entre y se registre como proveedor desde su cuenta." });
  }

  const segmento = d.tipo === "empresa" ? "empresa" : d.rut === "si" ? "independiente_con_rut" : "independiente_sin_rut";
  const usuarioId = randomUUID();
  const correo = d.correo ? d.correo.toLowerCase() : `${usuarioId}@sin-correo.lastresb.invalid`;

  // El proveedor confirma WhatsApp, acepta términos y crea su clave desde su propia invitación (Ley 1581):
  // aquí solo queda el borrador a su nombre.
  // Con invitación el correo queda verificado: el enlace para crear la clave solo llega a ese buzón.
  await db.insert(user).values({ id: usuarioId, name: d.nombreLegal, email: correo, emailVerified: invitar, telefono: d.whatsapp });
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
      fuenteOrigen: d.fuente ?? null,
      primerContacto: hoyBogota(),
      ultimoContacto: hoyBogota(),
    })
    .returning({ id: proveedores.id });
  const id = nuevo!.id;

  await db.insert(usuarioRoles).values({ usuarioId, rol: "proveedor", asignadoPor: actor.user.id });
  await db.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: id, categoriaId })));
  await db.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: id, localidadId })));
  if (d.servicio) {
    const sinPrecio = await categoriasSinPrecio([categoriaIds[0]!]);
    await db.insert(serviciosProveedor).values({ proveedorId: id, categoriaId: categoriaIds[0], nombre: d.servicio, precioDesde: sinPrecio ? null : d.precio?.replace(/\D/g, "") || null, unidad: sinPrecio ? "trabajo" : d.unidad });
  }

  await guardarCompletitud(id);

  if (invitar) {
    const { url, horas } = await crearInvitacion(usuarioId, DESTINO_PROVEEDOR_INVITADO);
    await enviarInvitacionPorCorreo({ para: correo, nombre: d.nombreLegal, url, horas, motivo: `El equipo de LasTresB te registró como proveedor («${d.nombrePublico}»). Al entrar revisas tus datos, aceptas los términos y envías tu perfil a revisión.` });
  }
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "alta_asistida", objetoTipo: "proveedor", objetoId: id, metadatos: { origen: d.origen, invitado: invitar } });
  revalidatePath("/admin", "layout");
  volver(`/admin/proveedores/${id}`, {
    ok: invitar
      ? `Borrador de ${d.nombrePublico} creado y la invitación enviada a ${correo}. Envíasela también por WhatsApp con el botón de abajo.`
      : `Borrador de ${d.nombrePublico} creado. Carga sus documentos aquí o envíale la invitación cuando tenga correo.`,
  });
}

const fechaOpcional = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa la fecha.").optional().or(z.literal("").transform(() => undefined));

const esquemaSeguimiento = z.object({
  fuente: z.enum(VALORES_FUENTE).optional().or(z.literal("").transform(() => undefined)),
  primerContacto: fechaOpcional,
  ultimoContacto: fechaOpcional,
  proximaAccion: z.string().trim().max(200, "La próxima acción admite hasta 200 caracteres.").optional(),
  notas: z.string().trim().max(2000, "Las notas admiten hasta 2000 caracteres.").optional(),
});

/** B1 · Seguimiento interno: fuente, fechas de contacto, próxima acción y notas. Solo el equipo lo ve. */
export async function guardarSeguimiento(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const ruta = `/admin/proveedores/${id}`;
  const r = esquemaSeguimiento.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) volver(ruta, { error: r.error.issues[0]?.message ?? "Revisa los datos." });
  const d = r.data;

  await db
    .update(proveedores)
    .set({ fuenteOrigen: d.fuente ?? null, primerContacto: d.primerContacto ?? null, ultimoContacto: d.ultimoContacto ?? null, proximaAccion: d.proximaAccion || null, notasInternas: d.notas || null, updatedAt: new Date() })
    .where(eq(proveedores.id, id));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "seguimiento_actualizado", objetoTipo: "proveedor", objetoId: id });
  revalidatePath(ruta);
  volver(ruta, { ok: "Seguimiento guardado." });
}

const esquemaPerfilEquipo = z.object({
  nombrePublico: z.string().trim().min(2, "Escribe el nombre público."),
  whatsapp: z.string().transform((v) => v.replace(/[^\d+]/g, "")).pipe(z.string().regex(/^\+?\d{10,13}$/, "Revisa el WhatsApp.")),
  presentacion: z.string().trim().max(280, "La presentación admite hasta 280 caracteres.").optional(),
  aniosExperiencia: z.coerce.number().int().min(0).max(80).optional().or(z.literal("").transform(() => undefined)),
});

/**
 * B1 · Edita el perfil público a nombre del proveedor: textos, zonas y lo que declara.
 * No toca datos sensibles (documento, RUT, nacimiento, dirección, archivos), el estado ni los oficios (cambian las exigencias de RUT y Ley 1918).
 * Queda en la auditoría con quien lo hizo.
 */
export async function editarPerfilComoEquipo(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const ruta = `/admin/proveedores/${id}`;
  const r = esquemaPerfilEquipo.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) volver(ruta, { error: r.error.issues[0]?.message ?? "Revisa los datos." });

  const localidadIds = formData.getAll("localidad").map(Number).filter(Number.isInteger);
  if (localidadIds.length === 0) volver(ruta, { error: "Elige al menos una localidad." });

  const [p] = await db.select({ slug: proveedores.slug }).from(proveedores).where(eq(proveedores.id, id)).limit(1);
  if (!p) volver("/admin/aprobaciones", { error: "Proveedor no encontrado." });
  await db
    .update(proveedores)
    .set({
      nombrePublico: r.data.nombrePublico,
      whatsapp: r.data.whatsapp,
      presentacion: r.data.presentacion || null,
      aniosExperiencia: r.data.aniosExperiencia ?? null,
      emiteFactura: formData.has("emiteFactura"),
      ofreceGarantia: formData.has("ofreceGarantia"),
      atiendeUrgencias: formData.has("atiendeUrgencias"),
      disponible24h: formData.has("disponible24h"),
      visitaAConvenir: formData.has("visitaAConvenir"),
      updatedAt: new Date(),
    })
    .where(eq(proveedores.id, id));
  await db.delete(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, id));
  await db.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: id, localidadId })));
  await guardarCompletitud(id);
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "perfil_editado_por_equipo", objetoTipo: "proveedor", objetoId: id });
  revalidatePath(ruta);
  revalidatePath(`/${p.slug}`);
  volver(ruta, { ok: "Perfil actualizado a nombre del proveedor." });
}

const esquemaServicioEquipo = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del servicio.").max(80),
  descripcion: z.string().trim().max(140, "El detalle admite hasta 140 caracteres.").optional(),
  precio: z.string().optional(),
  unidad: z.enum(["visita", "hora", "clase", "metro2", "trayecto", "trabajo"]).default("visita"),
});

/** B1 · Agrega o corrige un servicio del proveedor (sin `servicioId` crea uno). Los servicios de Aseo no guardan precio. */
export async function guardarServicioComoEquipo(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const ruta = `/admin/proveedores/${id}`;
  const servicioId = texto(formData, "servicioId");
  const r = esquemaServicioEquipo.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) volver(ruta, { error: r.error.issues[0]?.message ?? "Revisa los datos." });

  const { categoriaId, sinPrecio } = await oficioDelServicio(id, Number(formData.get("categoriaId")) || null);
  const datos = {
    nombre: r.data.nombre,
    descripcion: r.data.descripcion || null,
    precioDesde: sinPrecio ? null : r.data.precio?.replace(/\D/g, "") || null,
    unidad: sinPrecio ? ("trabajo" as const) : r.data.unidad,
    categoriaId,
  };
  if (servicioId) await db.update(serviciosProveedor).set(datos).where(and(eq(serviciosProveedor.id, Number(servicioId)), eq(serviciosProveedor.proveedorId, id)));
  else await db.insert(serviciosProveedor).values({ proveedorId: id, ...datos });

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "perfil_editado_por_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { servicio: datos.nombre } });
  revalidatePath(ruta);
  volver(ruta, { ok: servicioId ? "Servicio actualizado." : "Servicio agregado." });
}

/** B1 · Oculta un servicio del perfil (no se borra). */
export async function quitarServicioComoEquipo(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const ruta = `/admin/proveedores/${id}`;
  await db.update(serviciosProveedor).set({ visible: false }).where(and(eq(serviciosProveedor.id, z.coerce.number().int().parse(formData.get("servicioId"))), eq(serviciosProveedor.proveedorId, id)));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "perfil_editado_por_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { servicio_quitado: true } });
  revalidatePath(ruta);
  volver(ruta, { ok: "Servicio quitado." });
}

/** Adónde llega el proveedor invitado después de crear su clave: revisa, acepta términos y envía a revisión. */
const DESTINO_PROVEEDOR_INVITADO = "/panel/confirmar";

/** B1 · Crea un enlace nuevo (anula el anterior) y lo envía por correo. Solo para borradores con correo real. */
export async function reenviarInvitacion(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const [p] = await db
    .select({ usuarioId: proveedores.usuarioId, nombre: proveedores.nombrePublico, estado: proveedores.estado, correo: user.email, legal: user.name })
    .from(proveedores)
    .innerJoin(user, eq(user.id, proveedores.usuarioId))
    .where(eq(proveedores.id, id))
    .limit(1);
  const vuelta = texto(formData, "vuelta") === "nuevo" ? "/admin/proveedores/nuevo" : `/admin/proveedores/${id}`;
  if (!p) volver(vuelta, { error: "Proveedor no encontrado." });
  if (esCorreoFicticio(p.correo)) volver(vuelta, { error: "Este proveedor no tiene correo: sin él no puede ingresar." });
  if (p.estado !== "borrador") volver(vuelta, { error: "Solo se invita a perfiles en borrador." });

  await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, p.usuarioId));
  const { url, horas } = await crearInvitacion(p.usuarioId, DESTINO_PROVEEDOR_INVITADO);
  await enviarInvitacionPorCorreo({ para: p.correo, nombre: p.legal, url, horas, motivo: `El equipo de LasTresB te registró como proveedor («${p.nombre}»). Al entrar revisas tus datos, aceptas los términos y envías tu perfil a revisión.` });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "invitacion_reenviada", objetoTipo: "proveedor", objetoId: id });
  revalidatePath("/admin", "layout");
  volver(vuelta, { ok: `Invitación enviada a ${p.correo}.` });
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

  const { url, horas } = await crearInvitacion(nuevo.id);
  await enviarInvitacionPorCorreo({ para: correo, nombre, url, horas, motivo: "El equipo de LasTresB te creó una cuenta con este correo." });

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "usuario_creado", objetoTipo: "usuario", objetoId: nuevo.id, metadatos: { roles } });
  revalidatePath("/admin", "layout");
  volver("/admin/usuarios", { u: nuevo.id, ok: `Cuenta creada. Enviamos la invitación a ${correo}.` });
}

/** B4 · Qué roles del equipo deben usar 2FA. Solo admin; el rol admin siempre lo exige y no se puede cambiar. */
export async function cambiarExigencia2fa(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const antes = await exigencia2fa();
  const cambios: Record<string, { antes: boolean; despues: boolean }> = {};
  for (const rol of ROLES_2FA_OPCIONAL) {
    const exige = formData.get(rol) === "on";
    if (exige === antes[rol]) continue;
    await guardarExigencia2fa(rol, exige);
    cambios[rol] = { antes: antes[rol], despues: exige };
  }
  if (Object.keys(cambios).length) await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "exigencia_2fa_actualizada", objetoTipo: "configuracion", metadatos: cambios });
  volver("/admin/usuarios", { ok: Object.keys(cambios).length ? "Exigencia de segundo factor guardada." : "No hubo cambios." });
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

/** B4 · El admin le asigna una clave nueva a una cuenta. La clave nunca va a la auditoría. */
export async function cambiarClaveUsuario(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const usuarioId = z.string().min(1).parse(texto(formData, "usuarioId"));
  const clave = String(formData.get("clave") ?? "");
  if (usuarioId === actor.user.id) volver("/admin/usuarios", { u: usuarioId, error: "Tu propia clave cámbiala desde Mi cuenta." });
  if (clave.length < CLAVE_MIN || clave.length > CLAVE_MAX) volver("/admin/usuarios", { u: usuarioId, error: `La clave debe tener entre ${CLAVE_MIN} y ${CLAVE_MAX} caracteres.` });
  if (clave !== String(formData.get("confirmacion") ?? "")) volver("/admin/usuarios", { u: usuarioId, error: "Las dos claves no coinciden." });

  const hecho = await asignarClave(usuarioId, clave);
  if (!hecho) volver("/admin/usuarios", { error: "No encontramos esa cuenta." });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "clave_asignada", objetoTipo: "usuario", objetoId: usuarioId });
  volver("/admin/usuarios", { u: usuarioId, ok: "Clave cambiada y sesiones cerradas. Compártela con la persona por un canal privado." });
}

/* ───────────── Catálogo ───────────── */

/** Edita una categoría o, sin `id`, crea una nueva (sin padre queda como categoría principal). */
export async function guardarCategoria(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const idTexto = texto(formData, "id");
  const nueva = idTexto === "";
  const id = nueva ? null : z.coerce.number().int().parse(idTexto);
  const vuelta = nueva ? "nueva" : String(id);
  const slug = slugSchema.safeParse(texto(formData, "slug"));
  const nombre = texto(formData, "nombre");
  if (!slug.success || nombre.length < 2) volver("/admin/catalogo", { c: vuelta, error: "Revisa el nombre y el slug." });
  const [choque] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(id === null ? eq(categorias.slug, slug.data) : and(eq(categorias.slug, slug.data), sql`${categorias.id} <> ${id}`))
    .limit(1);
  if (choque) volver("/admin/catalogo", { c: vuelta, error: "Ese slug ya lo usa otra categoría." });

  const datos = {
    nombre,
    slug: slug.data,
    padreId: Number(texto(formData, "padreId")) || null,
    exigeInsigniaMenores: formData.has("menores"),
    exigeRutDesdeAlta: formData.has("rut"),
    exigeMatricula: formData.has("matricula"),
    activa: formData.has("activa"),
  };
  let categoriaId: number;
  if (id === null) {
    const [c] = await db.insert(categorias).values(datos).returning({ id: categorias.id });
    categoriaId = c!.id;
  } else {
    await db.update(categorias).set(datos).where(eq(categorias.id, id));
    categoriaId = id;
  }

  const terminos = [...new Set(texto(formData, "terminos").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
  await db.delete(terminosBusqueda).where(eq(terminosBusqueda.categoriaId, categoriaId));
  if (terminos.length) await db.insert(terminosBusqueda).values(terminos.map((termino) => ({ termino, categoriaId })));

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: nueva ? "categoria_creada" : "categoria_actualizada", objetoTipo: "categoria", objetoId: String(categoriaId) });
  revalidatePath("/categorias");
  volver("/admin/catalogo", { c: String(categoriaId), ok: nueva ? "Categoría creada." : "Categoría guardada." });
}

"use server";

/**
 * B1, B2, B4, B5 · Acciones del backoffice (Server Actions). Cada una exige sesión + rol + 2FA,
 * valida la entrada con zod y deja registro en `auditoria` (regla 3).
 */
import { registrarEvento } from "@/lib/actividad";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizarWhatsapp, PRESENTACION_MAX, redesDesdeBase, redesDesdeFormulario, slugSchema, sugerirSlug } from "@las3b/shared";
import { db, protegerDocumento, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { avisarPerfilEditado } from "@/lib/avisos-proveedor";
import { auth } from "@/lib/auth";
import { avisarProveedorAprobado, avisarProveedorRechazado } from "@/lib/avisos-proveedor";
import { asignarClave, CLAVE_MAX, CLAVE_MIN } from "@/lib/claves";
import { eliminarCuenta } from "@/lib/eliminar-cuenta";
import { MOTIVOS_RECHAZO as MOTIVOS } from "@/lib/motivos-rechazo";
import { crearInvitacion, enviarInvitacionPorCorreo, esCorreoFicticio } from "@/lib/invitaciones";
import { crearBorrador, crearPerfilesFaltantes, slugLibre } from "@/lib/alta-proveedor";
import { quitarFoto } from "@/lib/fotos";
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

  await registrarEvento(id, "estado", { detalle: "Aprobado por el equipo" });
  // Insignia «Verificado» automática al aprobar.
  const [verificado] = await db.select({ id: insignias.id }).from(insignias).where(eq(insignias.clave, "verificado")).limit(1);
  if (verificado) {
    await db.insert(proveedorInsignias).values({ proveedorId: id, insigniaId: verificado.id, otorgadaPor: actor.user.id }).onConflictDoNothing();
  }

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "proveedor_aprobado", objetoTipo: "proveedor", objetoId: id });
  await avisarProveedorAprobado(id);
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
  await registrarEvento(id, "estado", { detalle: "Rechazado por el equipo" });
  await avisarProveedorRechazado(id, mensaje ? `${motivo}: ${mensaje}` : motivo);
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
  // Documento, correo y dirección son opcionales para el equipo: el proveedor los completa después si hace falta.
  tipoDocumento: z.enum(["cc", "ce", "ppt", "nit"]).optional().or(z.literal("")),
  documento: z.string().trim().regex(/^\d{5,15}$/, "El número de documento va sin puntos ni espacios.").optional().or(z.literal("")),
  fechaNacimiento: z.string().optional(),
  // Formato estándar «+57XXXXXXXXXX»: se escribe solo el número y el sistema agrega el indicativo.
  whatsapp: z.string().transform((v, ctx) => normalizarWhatsapp(v) ?? (ctx.addIssue({ code: "custom", message: "Revisa el WhatsApp: son 10 dígitos, por ejemplo 300 123 4567." }), z.NEVER)),
  correo: z.string().email("Revisa el correo.").optional().or(z.literal("")),
  direccion: z.string().trim().max(160, "La dirección admite hasta 160 caracteres.").optional(),
  presentacion: z.string().max(PRESENTACION_MAX, `La presentación admite hasta ${PRESENTACION_MAX} caracteres.`).optional(),
  servicio: z.string().optional(),
  servicioCategoria: z.string().optional(),
  precio: z.string().optional(),
  unidad: z.enum(["visita", "hora", "clase", "trabajo"]).default("visita"),
  // Vacío o «automática»: la dirección se genera con el modelo de la plataforma (nombre + localidad).
  slug: z.union([z.literal(""), slugSchema]).optional(),
  slugAuto: z.string().optional(),
  origen: z.string().default("En persona"),
  fuente: z.enum(VALORES_FUENTE).optional().or(z.literal("").transform(() => undefined)),
});

export async function crearProveedorAsistido(formData: FormData) {
  const actor = await exigirBackoffice();
  const crudo: Record<string, FormDataEntryValue> = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  // Si el equipo la escribe a mano, la dirección se normaliza («Jorge Plomería» → «jorge-plomeria») en vez de rechazarla.
  crudo.slug = sugerirSlug(String(crudo.slug ?? ""));
  const r = altaAsistida.safeParse(crudo);
  if (!r.success) volver("/admin/proveedores/nuevo", { error: r.error.issues[0]?.message ?? "Revisa los datos." });
  const d = r.data;

  const categoriaIds = formData.getAll("categoria").map(Number).filter(Number.isInteger);
  const localidadIds = formData.getAll("localidad").map(Number).filter(Number.isInteger);
  if (categoriaIds.length === 0) volver("/admin/proveedores/nuevo", { error: "Elige al menos una categoría." });
  if (d.servicio && d.servicioCategoria && !categoriaIds.includes(Number(d.servicioCategoria))) volver("/admin/proveedores/nuevo", { error: "El oficio del servicio debe ser uno de los oficios elegidos." });
  if (localidadIds.length === 0) volver("/admin/proveedores/nuevo", { error: "Elige al menos una localidad." });
  // Con el correo el proveedor ingresa después de crear su clave: sin él la invitación no le sirve.
  const invitar = texto(formData, "accion") === "invitar";
  if (invitar && !d.correo) volver("/admin/proveedores/nuevo", { error: "Para enviar la invitación el proveedor necesita un correo: con él ingresará. Agrégalo o guarda solo el borrador." });

  // Dirección de la página: si el equipo la escribió, debe estar libre; si es automática, se genera con el nombre y se deshace cualquier choque con un número.
  let slug = d.slug ?? "";
  if (!slug || d.slugAuto === "1") {
    slug = await slugLibre(slug || sugerirSlug(d.nombrePublico));
  } else {
    const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, slug)).limit(1);
    if (existe) volver("/admin/proveedores/nuevo", { error: "Esa dirección de página ya está en uso." });
  }
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
      slug,
      presentacion: d.presentacion || null,
      whatsapp: d.whatsapp,
      emiteFactura: d.factura === "si",
      tipoDocumento: d.documento ? d.tipoDocumento || "cc" : null,
      ...(d.documento ? protegerDocumento(d.documento) : {}),
      direccionNotificaciones: d.direccion || null,
      fechaNacimiento: d.fechaNacimiento || null,
      fuenteOrigen: d.fuente ?? null,
      primerContacto: hoyBogota(),
      ultimoContacto: hoyBogota(),
    })
    .returning({ id: proveedores.id });
  const id = nuevo!.id;
  await registrarEvento(id, "creado", { campos: ["creado por el equipo"], clave: `creado:${id}` });

  await db.insert(usuarioRoles).values({ usuarioId, rol: "proveedor", asignadoPor: actor.user.id });
  await db.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: id, categoriaId })));
  await db.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: id, localidadId })));
  if (d.servicio) {
    const categoriaServicio = Number(d.servicioCategoria) || categoriaIds[0]!;
    const sinPrecio = await categoriasSinPrecio([categoriaServicio]);
    await db.insert(serviciosProveedor).values({ proveedorId: id, categoriaId: categoriaServicio, nombre: d.servicio, precioDesde: sinPrecio ? null : d.precio?.replace(/\D/g, "") || null, unidad: sinPrecio ? "trabajo" : d.unidad });
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
  // Formato estándar «+57XXXXXXXXXX»: se escribe solo el número y el sistema agrega el indicativo.
  whatsapp: z.string().transform((v, ctx) => normalizarWhatsapp(v) ?? (ctx.addIssue({ code: "custom", message: "Revisa el WhatsApp: son 10 dígitos, por ejemplo 300 123 4567." }), z.NEVER)),
  presentacion: z.string().trim().max(PRESENTACION_MAX, `La presentación admite hasta ${PRESENTACION_MAX} caracteres.`).optional(),
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

const esquemaEdicionAdmin = z.object({
  nombreLegal: z.string().trim().min(3, "Escribe el nombre completo o la razón social."),
  nombrePublico: z.string().trim().min(2, "Escribe el nombre público."),
  slug: slugSchema,
  whatsapp: z.string().transform((v, ctx) => normalizarWhatsapp(v) ?? (ctx.addIssue({ code: "custom", message: "Revisa el WhatsApp: son 10 dígitos, por ejemplo 300 123 4567." }), z.NEVER)),
  correo: z.string().trim().email("Revisa el correo.").optional().or(z.literal("")),
  presentacion: z.string().trim().max(PRESENTACION_MAX, `La presentación admite hasta ${PRESENTACION_MAX} caracteres.`).optional(),
  aniosExperiencia: z.coerce.number().int().min(0).max(80).optional().or(z.literal("").transform(() => undefined)),
  segmento: z.enum(["independiente_sin_rut", "independiente_con_rut", "empresa"]),
  tipoDocumento: z.enum(["cc", "ce", "ppt", "nit"]).optional().or(z.literal("")),
  // Vacío = no se cambia (el documento está cifrado y solo se muestra enmascarado).
  documento: z.string().trim().regex(/^\d{5,15}$/, "El número de documento va sin puntos ni espacios.").optional().or(z.literal("")),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa la fecha de nacimiento.").optional().or(z.literal("")),
  direccion: z.string().trim().max(160, "La dirección admite hasta 160 caracteres.").optional(),
  numeroMatricula: z.string().trim().max(30, "El número de matrícula admite hasta 30 caracteres.").optional(),
});

/**
 * B1 · El administrador edita TODOS los datos de un proveedor, en cualquier estado (borrador, pendiente, publicado…):
 * nombres, dirección de la página, WhatsApp, correo, presentación, tipo de trabajo, identidad, oficios, localidades y declaraciones.
 * Al proveedor solo le llega una notificación con QUÉ cambió (nunca los valores) y todo queda en la auditoría.
 * Cambiar la dirección de la página guarda la anterior para redirigirla (301). Cambiar el correo deja la cuenta por verificar.
 */
export async function editarTodoComoAdmin(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const ruta = `/admin/proveedores/${id}`;
  if (!actor.roles.includes("admin")) volver(ruta, { error: "Solo los administradores pueden editar todos los datos." });
  const r = esquemaEdicionAdmin.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) volver(ruta, { error: r.error.issues[0]?.message ?? "Revisa los datos." });
  const d = r.data;

  const { redes, error: errorRedes } = redesDesdeFormulario((n) => String(formData.get(n) ?? ""));
  if (errorRedes) volver(ruta, { error: errorRedes });

  const numeros = (nombre: string) => [...new Set(formData.getAll(nombre).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const categoriaIds = numeros("categoria");
  const localidadIds = numeros("localidad");
  if (categoriaIds.length === 0) volver(ruta, { error: "Deja al menos un oficio." });
  if (localidadIds.length === 0) volver(ruta, { error: "Elige al menos una localidad." });

  const [antes] = await db.select().from(proveedores).where(eq(proveedores.id, id)).limit(1);
  if (!antes) volver("/admin/aprobaciones", { error: "Proveedor no encontrado." });
  const [cuenta] = await db.select({ correo: user.email, nombre: user.name }).from(user).where(eq(user.id, antes.usuarioId)).limit(1);
  const [catsAntes, locsAntes] = await Promise.all([
    db.select({ id: proveedorCategorias.categoriaId }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, id)),
    db.select({ id: proveedorLocalidades.localidadId }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, id)),
  ]);

  const validas = await db.select({ id: categorias.id }).from(categorias).where(and(inArray(categorias.id, categoriaIds), isNotNull(categorias.padreId)));
  if (validas.length !== categoriaIds.length) volver(ruta, { error: "Uno de los oficios no existe." });
  // Un oficio con servicios publicados no se puede quitar sin antes cambiar o quitar esos servicios.
  const quitados = catsAntes.map((c) => c.id).filter((c) => !categoriaIds.includes(c));
  if (quitados.length > 0) {
    const [huerfano] = await db.select({ nombre: serviciosProveedor.nombre }).from(serviciosProveedor).where(and(eq(serviciosProveedor.proveedorId, id), eq(serviciosProveedor.visible, true), inArray(serviciosProveedor.categoriaId, quitados))).limit(1);
    if (huerfano) volver(ruta, { error: `Para quitar ese oficio, primero cambia o quita el servicio «${huerfano.nombre}».` });
  }
  if (d.slug !== antes.slug) {
    const [ocupado] = await db.select({ id: proveedores.id }).from(proveedores).where(and(eq(proveedores.slug, d.slug), ne(proveedores.id, id))).limit(1);
    if (ocupado) volver(ruta, { error: "Esa dirección de página ya está en uso." });
  }
  const correoNuevo = d.correo ? d.correo.toLowerCase() : "";
  const cambiaCorreo = Boolean(correoNuevo) && correoNuevo !== cuenta?.correo;
  if (cambiaCorreo) {
    const [otra] = await db.select({ id: user.id }).from(user).where(and(eq(user.email, correoNuevo), ne(user.id, antes.usuarioId))).limit(1);
    if (otra) volver(ruta, { error: "Ya hay una cuenta con ese correo." });
  }

  // Qué cambió, solo con nombres de campo (es lo único que se le cuenta al proveedor).
  const mismos = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));
  const declaraciones = { emiteFactura: formData.has("emiteFactura"), ofreceGarantia: formData.has("ofreceGarantia"), atiendeUrgencias: formData.has("atiendeUrgencias"), disponible24h: formData.has("disponible24h"), visitaAConvenir: formData.has("visitaAConvenir") };
  const cambios: string[] = [];
  if (d.nombrePublico !== antes.nombrePublico) cambios.push("Nombre público");
  if (d.nombreLegal !== cuenta?.nombre) cambios.push("Nombre completo o razón social");
  if (d.slug !== antes.slug) cambios.push("Dirección de tu página");
  if (d.whatsapp !== antes.whatsapp) cambios.push("WhatsApp");
  if (cambiaCorreo) cambios.push("Correo");
  if ((d.presentacion || null) !== (antes.presentacion || null)) cambios.push("Presentación");
  if ((d.aniosExperiencia ?? null) !== (antes.aniosExperiencia ?? null)) cambios.push("Años de experiencia");
  if (d.segmento !== antes.segmento) cambios.push("Cómo trabajas (independiente o empresa)");
  if ((d.tipoDocumento && d.tipoDocumento !== antes.tipoDocumento) || d.documento) cambios.push("Documento de identidad");
  if ((d.fechaNacimiento || null) !== (antes.fechaNacimiento || null)) cambios.push("Fecha de nacimiento");
  if ((d.direccion || null) !== (antes.direccionNotificaciones || null)) cambios.push("Dirección de notificaciones");
  if ((d.numeroMatricula || null) !== (antes.numeroMatricula || null)) cambios.push("Número de matrícula");
  if (Object.entries(declaraciones).some(([k, v]) => v !== Boolean((antes as Record<string, unknown>)[k]))) cambios.push("Lo que declaras en tu perfil (factura, garantía, urgencias…)");
  if (JSON.stringify(redesDesdeBase(antes.redesSociales)) !== JSON.stringify(redes)) cambios.push("Redes sociales");
  if (!mismos(locsAntes.map((l) => l.id), localidadIds)) cambios.push("Localidades donde trabajas");

  if (cambios.length === 0) volver(ruta, { ok: "No había cambios para guardar." });

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ name: d.nombreLegal, telefono: d.whatsapp, ...(cambiaCorreo ? { email: correoNuevo, emailVerified: false } : {}) })
        .where(eq(user.id, antes.usuarioId));
      await tx
        .update(proveedores)
        .set({
          nombrePublico: d.nombrePublico,
          slug: d.slug,
          whatsapp: d.whatsapp,
          presentacion: d.presentacion || null,
          aniosExperiencia: d.aniosExperiencia ?? null,
          segmento: d.segmento,
          tipoDocumento: d.tipoDocumento || antes.tipoDocumento || null,
          ...(d.documento ? protegerDocumento(d.documento) : {}),
          fechaNacimiento: d.fechaNacimiento || null,
          direccionNotificaciones: d.direccion || null,
          numeroMatricula: d.numeroMatricula || null,
          redesSociales: Object.keys(redes).length > 0 ? redes : null,
          ...declaraciones,
          updatedAt: new Date(),
        })
        .where(eq(proveedores.id, id));
      if (d.slug !== antes.slug) await tx.insert(schema.slugsHistorial).values({ slug: antes.slug, proveedorId: id }).onConflictDoNothing();
      await tx.delete(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, id));
      await tx.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: id, categoriaId })));
      await tx.delete(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, id));
      await tx.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: id, localidadId })));
    });
  } catch {
    volver(ruta, { error: "No pudimos guardar los cambios. Revisa que el documento o el correo no estén ya registrados en otra cuenta." });
  }

  await guardarCompletitud(id);
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "perfil_editado_por_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { campos: cambios, completo: true } });
  if (formData.has("avisar")) await avisarPerfilEditado(id, cambios);
  revalidatePath(ruta);
  revalidatePath(`/${antes.slug}`);
  revalidatePath(`/${d.slug}`);
  volver(ruta, { ok: `Datos actualizados (${cambios.join(", ")}). ${formData.has("avisar") ? "Le avisamos al proveedor por correo qué cambió; si no tiene correo real, avísale por WhatsApp." : "No se le envió aviso."}` });
}
/** B1 · Quita una foto de trabajo a nombre del proveedor (borra sus archivos del bucket público). Queda en la auditoría. */
export async function quitarFotoComoEquipo(formData: FormData) {
  const actor = await exigirBackoffice();
  const id = uuid.parse(texto(formData, "proveedorId"));
  const fotoId = uuid.parse(texto(formData, "fotoId"));
  const ruta = `/admin/proveedores/${id}`;
  const quitada = await quitarFoto(id, fotoId);
  if (quitada) await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "foto_quitada_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { fotoId } });
  const [p] = await db.select({ slug: proveedores.slug }).from(proveedores).where(eq(proveedores.id, id)).limit(1);
  revalidatePath(ruta);
  if (p) revalidatePath(`/${p.slug}`);
  volver(ruta, { ok: quitada ? "Foto quitada." : "No encontramos esa foto." });
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
    .object({ nombre: z.string().min(2).max(80), correo: z.string().email().max(120).optional().or(z.literal("")), roles: z.array(z.enum(ROLES)) })
    .safeParse({ nombre: texto(formData, "nombre"), correo: texto(formData, "correo").toLowerCase(), roles: formData.getAll("rol") });
  if (!datos.success) volver("/admin/usuarios", { nuevo: "1", error: "Revisa el nombre y el correo." });
  const { nombre, roles } = datos.data;
  // El correo es opcional para el equipo. Sin correo la cuenta queda con uno ficticio (como en el alta asistida) y no recibe invitación.
  const conCorreo = Boolean(datos.data.correo);
  if (!conCorreo && roles.some((r) => r !== "proveedor")) volver("/admin/usuarios", { nuevo: "1", error: "Los roles del equipo necesitan correo: con él ingresan y activan el 2FA. Sin correo solo se puede crear un proveedor o un usuario sin rol." });
  const correo = conCorreo ? datos.data.correo! : `${randomUUID()}@sin-correo.lastresb.invalid`;

  const [existe] = await db.select({ id: user.id }).from(user).where(eq(user.email, correo)).limit(1);
  if (existe) volver("/admin/usuarios", { u: existe.id, error: "Ya hay una cuenta con ese correo." });

  const ctx = await auth.$context;
  // Con correo, el admin responde por él: el enlace de invitación solo llega a ese buzón.
  const nuevo = await ctx.internalAdapter.createUser({ name: nombre, email: correo, emailVerified: conCorreo }, { method: "admin" });
  if (roles.length) await db.insert(usuarioRoles).values(roles.map((rol) => ({ usuarioId: nuevo.id, rol, asignadoPor: actor.user.id })));
  // Con el rol Proveedor la cuenta nace con su perfil en borrador (si no, quedaba «Proveedor · sin perfil»).
  if (roles.includes("proveedor")) await crearBorrador({ id: nuevo.id, name: nombre, email: correo });

  if (conCorreo) {
    const { url, horas } = await crearInvitacion(nuevo.id);
    await enviarInvitacionPorCorreo({ para: correo, nombre, url, horas, motivo: "El equipo de LasTresB te creó una cuenta con este correo." });
  }

  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "usuario_creado", objetoTipo: "usuario", objetoId: nuevo.id, metadatos: { roles, sinCorreo: !conCorreo } });
  revalidatePath("/admin", "layout");
  volver("/admin/usuarios", { u: nuevo.id, ok: conCorreo ? `Cuenta creada. Enviamos la invitación a ${correo}.` : "Cuenta creada sin correo. Cuando tenga uno, agrégalo desde su ficha." });
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

/** Crea el perfil en borrador a todas las cuentas con rol Proveedor que no lo tienen. Solo admin; queda en la auditoría. */
export async function crearPerfilesProveedorFaltantes() {
  const actor = await exigirBackoffice(true);
  const creados = await crearPerfilesFaltantes();
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "perfiles_proveedor_creados", objetoTipo: "usuario", resultado: String(creados) });
  revalidatePath("/admin", "layout");
  volver("/admin/usuarios", { ok: creados > 0 ? `Listo: creamos ${creados} ${creados === 1 ? "perfil" : "perfiles"} de proveedor en borrador.` : "No había cuentas de proveedor sin perfil." });
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

/** B4 · Eliminar cuenta (CU-27): sin historial se borra; con historial se bloquea y se conserva. Se confirma escribiendo el correo. */
export async function eliminarUsuario(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const usuarioId = z.string().min(1).parse(texto(formData, "usuarioId"));
  if (usuarioId === actor.user.id) volver("/admin/usuarios", { u: usuarioId, error: "No puedes eliminar tu propia cuenta." });
  const [persona] = await db.select({ correo: user.email }).from(user).where(eq(user.id, usuarioId)).limit(1);
  if (!persona) volver("/admin/usuarios", { error: "No encontramos esa cuenta." });
  if (texto(formData, "confirmacion").toLowerCase() !== persona.correo.toLowerCase()) {
    volver("/admin/usuarios", { u: usuarioId, error: "Escribe el correo de la cuenta tal cual para confirmar." });
  }
  const equipo = await db.select({ rol: usuarioRoles.rol }).from(usuarioRoles).where(eq(usuarioRoles.usuarioId, usuarioId));
  if (equipo.some((r) => r.rol === "admin" || r.rol === "verificador" || r.rol === "moderador")) {
    volver("/admin/usuarios", { u: usuarioId, error: "Es del equipo: quítale los roles de admin, verificador y moderador antes de eliminarla." });
  }

  const r = await eliminarCuenta(usuarioId);
  if (!r) volver("/admin/usuarios", { error: "No encontramos esa cuenta." });
  await auditar({
    actorId: actor.user.id, rol: actor.rol, accion: "usuario_eliminado", objetoTipo: "usuario", objetoId: usuarioId,
    motivo: texto(formData, "motivo") || undefined, metadatos: { modo: r.modo, correo: r.correo },
  });
  revalidatePath("/admin", "layout");
  if (r.modo === "borrada") volver("/admin/usuarios", { ok: `Cuenta ${r.correo} eliminada por completo: no tenía historial.` });
  volver("/admin/usuarios", { u: usuarioId, ok: "La cuenta tenía historial: quedó bloqueada, sin acceso, con el perfil oculto y sus reseñas anónimas. Los datos se conservan según CU-27." });
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

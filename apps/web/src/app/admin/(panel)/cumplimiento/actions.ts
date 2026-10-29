"use server";

/** B6 · Acciones de cumplimiento. Cada una exige sesión + rol + 2FA y queda en `auditoria`. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, descifrar, estaCifrado, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { enviarCorreo } from "@/lib/correo";
import { exigirBackoffice } from "@/lib/verificacion";

const { mensajesContacto, reclamos, solicitudesDatos, proveedores, user, politicas } = schema;
const ruta = "/admin/cumplimiento";
const volver = (params: Record<string, string>): never => redirect(`${ruta}?${new URLSearchParams(params)}`);
const id = z.string().uuid();

/** El documento se guarda cifrado; los registros anteriores al cifrado pueden seguir en claro hasta migrarlos. */
function documentoLegible(valor: string | null) {
  if (!valor) return null;
  return estaCifrado(valor) ? descifrar(valor) : valor;
}

/** Art. 53 de la Ley 1480: entrega al comprador los datos de identificación y contacto del proveedor. */
export async function entregarDatos(formData: FormData) {
  const actor = await exigirBackoffice();
  const reclamoId = id.parse(formData.get("id"));
  const [r] = await db.select().from(reclamos).where(eq(reclamos.id, reclamoId)).limit(1);
  if (!r) return volver({ error: "Reclamo no encontrado." });
  const [p] = await db.select().from(proveedores).where(eq(proveedores.id, r.proveedorId)).limit(1);
  if (!p) return volver({ error: "Proveedor no encontrado." });
  const [u] = await db.select({ nombre: user.name }).from(user).where(eq(user.id, p.usuarioId)).limit(1);

  await enviarCorreo({
    para: r.correoReclamante,
    asunto: "Datos del proveedor sobre tu reclamo en LasTresB",
    texto: [
      `Hola, ${r.nombreReclamante}.`,
      "Como pediste en tu reclamo, estos son los datos de identificación y contacto del proveedor (art. 53, Ley 1480 de 2011):",
      `- Nombre o razón social: ${u?.nombre ?? p.nombrePublico}`,
      `- Nombre público: ${p.nombrePublico}`,
      `- Documento: ${p.tipoDocumento?.toUpperCase() ?? ""} ${documentoLegible(p.documentoCifrado) ?? "no registrado"}`,
      `- Dirección de notificaciones: ${p.direccionNotificaciones ?? "no registrada"}`,
      `- Teléfono / WhatsApp: ${p.whatsapp}`,
      "",
      "LasTresB es un portal de contacto y no es parte de la relación con el proveedor.",
    ].join("\n"),
  });
  await db.update(reclamos).set({ datosEntregadosEn: new Date() }).where(eq(reclamos.id, reclamoId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "entregar_datos_art53", objetoTipo: "reclamo", objetoId: reclamoId, resultado: "enviado" });
  revalidatePath(ruta);
  return volver({ i: `reclamo:${reclamoId}`, ok: "Datos del proveedor enviados al comprador." });
}

export async function responderReclamo(formData: FormData) {
  const actor = await exigirBackoffice();
  const reclamoId = id.parse(formData.get("id"));
  const respuesta = z.string().trim().min(5, "Escribe la respuesta al comprador.").max(2000).safeParse(formData.get("respuesta"));
  if (!respuesta.success) return volver({ i: `reclamo:${reclamoId}`, error: respuesta.error.issues[0]?.message ?? "Revisa la respuesta." });
  const [r] = await db.select().from(reclamos).where(eq(reclamos.id, reclamoId)).limit(1);
  if (!r) return volver({ error: "Reclamo no encontrado." });
  if (r.solicitaDatosProveedor && !r.datosEntregadosEn) return volver({ i: `reclamo:${reclamoId}`, error: "El comprador pidió los datos del proveedor: entrégalos antes de cerrar." });

  await enviarCorreo({ para: r.correoReclamante, asunto: "Respuesta a tu reclamo en LasTresB", texto: `Hola, ${r.nombreReclamante}.\n\n${respuesta.data}\n\nLasTresB` });
  await db.update(reclamos).set({ estado: "respondido" }).where(eq(reclamos.id, reclamoId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "reclamo_respondido", objetoTipo: "reclamo", objetoId: reclamoId, metadatos: { respuesta: respuesta.data } });
  revalidatePath("/admin", "layout");
  return volver({ ok: "Reclamo respondido y cerrado." });
}

export async function gestionarSolicitud(formData: FormData) {
  const actor = await exigirBackoffice();
  const solicitudId = id.parse(formData.get("id"));
  const estado = z.enum(["en_proceso", "respondido", "cerrado"]).parse(formData.get("estado"));
  const respuesta = String(formData.get("respuesta") ?? "").trim();
  const [s] = await db.select({ usuarioId: solicitudesDatos.usuarioId }).from(solicitudesDatos).where(eq(solicitudesDatos.id, solicitudId)).limit(1);
  if (!s) return volver({ error: "Solicitud no encontrada." });
  if (estado !== "en_proceso" && respuesta.length < 5) return volver({ i: `datos:${solicitudId}`, error: "Escribe la respuesta para la persona." });

  if (respuesta) {
    const [u] = await db.select({ correo: user.email, nombre: user.name }).from(user).where(eq(user.id, s.usuarioId)).limit(1);
    if (u) await enviarCorreo({ para: u.correo, asunto: "Respuesta a tu solicitud sobre tus datos en LasTresB", texto: `Hola, ${u.nombre}.\n\n${respuesta}\n\nLasTresB` });
  }
  await db.update(solicitudesDatos).set({ estado }).where(eq(solicitudesDatos.id, solicitudId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: `solicitud_datos_${estado}`, objetoTipo: "solicitud_datos", objetoId: solicitudId, metadatos: respuesta ? { respuesta } : undefined });
  revalidatePath("/admin", "layout");
  return volver({ ok: estado === "en_proceso" ? "Solicitud marcada en proceso." : "Solicitud respondida." });
}

const TIPOS = ["terminos_compradores", "terminos_proveedores", "tratamiento_datos", "aviso_privacidad", "cookies", "resenas", "autorizacion_ley_1918", "declaracion_servicios_no_permitidos"] as const;

/** Publica una nueva versión de una política. La re-aceptación de las personas usuarias aún se gestiona aparte. */
export async function publicarPolitica(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const r = z.object({ tipo: z.enum(TIPOS), version: z.string().trim().min(1).max(20), contenido: z.string().trim().min(50, "El texto es muy corto.") }).safeParse(Object.fromEntries(formData));
  if (!r.success) return volver({ tab: "politicas", error: r.error.issues[0]?.message ?? "Revisa los datos." });
  await db.insert(politicas).values({ tipo: r.data.tipo, version: r.data.version, contenidoMd: r.data.contenido, esencial: true, vigenteDesde: new Date() });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "politica_publicada", objetoTipo: "politica", objetoId: `${r.data.tipo}@${r.data.version}` });
  revalidatePath(ruta);
  return volver({ tab: "politicas", ok: "Nueva versión publicada." });
}

/** Marca un mensaje de /contacto como atendido. La respuesta se envía por correo desde fuera del sistema. */
export async function atenderMensaje(formData: FormData) {
  const actor = await exigirBackoffice();
  const mensajeId = id.parse(formData.get("id"));
  await db.update(mensajesContacto).set({ estado: "atendido" }).where(eq(mensajesContacto.id, mensajeId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "mensaje_contacto_atendido", objetoTipo: "mensaje_contacto", objetoId: mensajeId });
  revalidatePath("/admin", "layout");
  return volver({ tab: "mensajes", ok: "Mensaje marcado como atendido." });
}

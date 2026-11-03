"use server";

/** B7 · Solicitudes de clientes y su seguimiento. Solo administradores; cada cambio queda en la bitácora y en `auditoria`. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { registrarEvento, VALORES_ESTADO } from "@/lib/seguimiento-solicitudes";
import { marcarCalificacionEnviada } from "@/lib/servicios-prestados";
import { exigirBackoffice } from "@/lib/verificacion";

const uuid = z.string().uuid();

async function admin() {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("admin")) redirect("/admin");
  return actor;
}

/** Vuelve a la lista con los mismos filtros (solo a rutas de esta sección). */
function volver(formData: FormData): never {
  const v = String(formData.get("volver") ?? "");
  revalidatePath("/admin/solicitudes");
  redirect(v.startsWith("/admin/solicitudes") ? v : "/admin/solicitudes");
}

/** Marca que ya se le envió al cliente, por WhatsApp, la invitación a calificar el servicio prestado. */
export async function marcarCalificacionEnviadaPorWhatsapp(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("servicioId"));
  await marcarCalificacionEnviada(id, "whatsapp");
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "calificacion_enviada", objetoTipo: "servicio", objetoId: id, resultado: "whatsapp" });
  volver(formData);
}

/** Cambia el estado del caso, con una nota opcional. */
export async function cambiarEstadoSolicitud(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const estado = z.enum(VALORES_ESTADO).parse(formData.get("estado"));
  const nota = String(formData.get("nota") ?? "").slice(0, 500);
  await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "estado", estadoNuevo: estado, nota });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "solicitud_actualizada", objetoTipo: "solicitud", objetoId: id, resultado: estado });
  volver(formData);
}

/** Agrega una nota a la bitácora sin cambiar el estado. */
export async function agregarNotaSolicitud(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const nota = String(formData.get("nota") ?? "").trim().slice(0, 500);
  if (nota) await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "nota", nota });
  volver(formData);
}

/** Quien lo pulsa se queda con el caso (o lo suelta si ya era suyo). Un caso nuevo pasa a «en gestión». */
export async function tomarSolicitud(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const [s] = await db.select({ responsableId: schema.solicitudesServicio.responsableId, estado: schema.solicitudesServicio.estado }).from(schema.solicitudesServicio).where(eq(schema.solicitudesServicio.id, id)).limit(1);
  if (!s) volver(formData);
  const suelta = s.responsableId === actor.user.id;
  await db.update(schema.solicitudesServicio).set({ responsableId: suelta ? null : actor.user.id }).where(eq(schema.solicitudesServicio.id, id));
  await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "asignacion", nota: suelta ? "Soltó el caso." : "Tomó el caso.", ...(!suelta && s.estado === "nueva" ? { estadoNuevo: "en_gestion" as const } : {}) });
  volver(formData);
}

/** Fecha en que hay que volver a mirar el caso (vacía = sin fecha). */
export async function programarAccionSolicitud(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const fecha = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).parse(String(formData.get("fecha") ?? ""));
  await db.update(schema.solicitudesServicio).set({ proximaAccionEn: fecha || null, actualizadaEn: new Date() }).where(eq(schema.solicitudesServicio.id, id));
  await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "nota", nota: fecha ? `Próxima acción: ${fecha}.` : "Quitó la fecha de próxima acción." });
  volver(formData);
}

/** El equipo ya le escribió por WhatsApp a un proveedor para que contacte al cliente. */
export async function registrarProveedorContactado(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const proveedorId = uuid.parse(formData.get("proveedorId"));
  await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "proveedor", canal: "whatsapp", proveedorId, nota: "Se le pidió contactar al cliente." });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "solicitud_proveedor_contactado", objetoTipo: "solicitud", objetoId: id, resultado: proveedorId });
  volver(formData);
}

/** El equipo ya le escribió por WhatsApp al cliente. */
export async function registrarClienteAvisado(formData: FormData) {
  const actor = await admin();
  const id = uuid.parse(formData.get("id"));
  const nota = String(formData.get("nota") ?? "").slice(0, 200);
  await registrarEvento({ solicitudId: id, autorId: actor.user.id, tipo: "cliente", canal: "whatsapp", nota: nota || "Se le escribió al cliente." });
  volver(formData);
}

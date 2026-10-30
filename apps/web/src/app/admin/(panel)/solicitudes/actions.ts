"use server";

/** B7 · Solicitudes de clientes. Solo administradores; cada cambio queda en `auditoria`. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { marcarCalificacionEnviada } from "@/lib/servicios-prestados";
import { exigirBackoffice } from "@/lib/verificacion";

/** Marca que ya se le envió al cliente, por WhatsApp, la invitación a calificar el servicio prestado. */
export async function marcarCalificacionEnviadaPorWhatsapp(formData: FormData) {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("admin")) redirect("/admin");
  const id = z.string().uuid().parse(formData.get("servicioId"));
  await marcarCalificacionEnviada(id, "whatsapp");
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "calificacion_enviada", objetoTipo: "servicio", objetoId: id, resultado: "whatsapp" });
  revalidatePath("/admin/solicitudes");
  redirect("/admin/solicitudes");
}

/** Marca la solicitud como avisada (o la devuelve a nueva) después de escribirle al cliente por WhatsApp. */
export async function cambiarEstadoSolicitud(formData: FormData) {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("admin")) redirect("/admin");
  const id = z.string().uuid().parse(formData.get("id"));
  const estado = formData.get("estado") === "nueva" ? "nueva" : "avisada";
  await db.update(schema.solicitudesServicio).set({ estado }).where(eq(schema.solicitudesServicio.id, id));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "solicitud_actualizada", objetoTipo: "solicitud", objetoId: id, resultado: estado });
  revalidatePath("/admin/solicitudes");
  redirect("/admin/solicitudes");
}

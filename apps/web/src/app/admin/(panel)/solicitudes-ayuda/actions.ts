"use server";

/** B7 · Solicitudes de ayuda para inscripción: marcar una como contactada. Solo administradores; queda en `auditoria`. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { marcarAyudaContactada } from "@/lib/solicitudes-ayuda";
import { exigirBackoffice } from "@/lib/verificacion";

export async function marcarContactada(formData: FormData) {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("admin")) redirect("/admin");
  const id = z.string().uuid().parse(formData.get("id"));
  await marcarAyudaContactada(id, actor.user.id);
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "ayuda_inscripcion_contactada", objetoTipo: "solicitud_ayuda_inscripcion", objetoId: id });
  revalidatePath("/admin/solicitudes-ayuda");
  redirect("/admin/solicitudes-ayuda");
}

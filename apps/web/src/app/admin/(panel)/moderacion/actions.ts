"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { aplicarDecision, MOTIVOS_MODERACION, revisarReincidencia } from "@/lib/moderacion";
import { parametro } from "@/lib/parametros";
import { exigirBackoffice } from "@/lib/verificacion";

const esquema = z.object({
  tipo: z.enum(["resena", "respuesta", "foto", "servicio", "slug", "perfil"]),
  objetoId: z.string().min(1).max(500),
  accion: z.enum(["mantener", "ocultar", "eliminar"]),
  motivo: z.enum(MOTIVOS_MODERACION),
});

/** B3: guarda la decisión de moderación. Solo moderadores y administradores. */
export async function decidir(formData: FormData) {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("moderador") && !actor.roles.includes("admin")) redirect("/admin");

  const r = esquema.safeParse(Object.fromEntries(formData));
  if (!r.success) redirect(`/admin/moderacion?${new URLSearchParams({ error: "Elige una acción y un motivo." })}`);
  const d = r.data;

  const proveedorId = await aplicarDecision(d.tipo, d.objetoId, d.accion);
  await db.insert(schema.accionesModeracion).values({ tipoObjeto: d.tipo, objetoId: d.objetoId, moderadorId: actor.user.id, accion: d.accion, motivo: d.motivo });
  await auditar({
    actorId: actor.user.id,
    rol: actor.rol,
    accion: `moderacion_${d.accion}`,
    objetoTipo: d.tipo,
    objetoId: d.objetoId,
    motivo: d.motivo,
    metadatos: { proveedorId },
  });

  let aviso = d.accion === "mantener" ? "Contenido mantenido; los reportes quedaron resueltos." : "Decisión guardada.";
  if (proveedorId && d.accion !== "mantener" && (await revisarReincidencia(proveedorId, await parametro("ventana_reputacion_dias")))) {
    aviso += " El proveedor acumuló tres contenidos ocultos y pasó a «en revisión».";
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/moderacion?${new URLSearchParams({ ok: aviso })}`);
}

/** Solicitudes de retiro (enlaces): se marcan como atendidas cuando el equipo ya actuó por otra vía. */
export async function marcarAtendida(formData: FormData) {
  const actor = await exigirBackoffice();
  if (!actor.roles.includes("moderador") && !actor.roles.includes("admin")) redirect("/admin");
  const objetoId = z.string().min(1).max(500).parse(formData.get("objetoId"));
  const nota = z.string().trim().max(300).optional().parse(formData.get("nota") ?? undefined);
  await db.update(schema.reportes).set({ resuelto: true }).where(eq(schema.reportes.objetoId, objetoId));
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "retiro_atendido", objetoTipo: "enlace", objetoId, motivo: nota || undefined });
  revalidatePath("/admin", "layout");
  redirect(`/admin/moderacion?${new URLSearchParams({ ok: "Solicitud marcada como atendida." })}`);
}
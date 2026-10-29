"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { PARAMETROS } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { todosLosParametros } from "@/lib/parametros";
import { exigirBackoffice } from "@/lib/verificacion";

/** B8 · Guarda los parámetros configurables (CU-79). Solo administradores; cada cambio queda en la auditoría con valor anterior y nuevo. */
export async function guardarParametros(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const antes = new Map((await todosLosParametros()).map((p) => [p.clave, p.valor]));
  const cambios: Record<string, { antes: number | null; despues: number | null }> = {};

  for (const p of PARAMETROS) {
    const crudo = String(formData.get(p.clave) ?? "").trim();
    const nuevo = crudo === "" ? null : Number(crudo);
    if (nuevo !== null && (!Number.isFinite(nuevo) || nuevo < 0)) redirect(`/admin/auditoria?${new URLSearchParams({ error: `Revisa «${p.etiqueta}»: debe ser un número positivo.` })}`);
    const previo = antes.get(p.clave) ?? null;
    if (nuevo === previo) continue;
    cambios[p.clave] = { antes: previo, despues: nuevo };
    if (nuevo === null) await db.delete(schema.configuracion).where(eq(schema.configuracion.clave, p.clave));
    else await db.insert(schema.configuracion).values({ clave: p.clave, valor: nuevo }).onConflictDoUpdate({ target: schema.configuracion.clave, set: { valor: nuevo, actualizadoEn: new Date() } });
  }

  if (Object.keys(cambios).length > 0) await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "parametros_actualizados", objetoTipo: "configuracion", metadatos: cambios });
  revalidatePath("/admin/auditoria");
  redirect(`/admin/auditoria?${new URLSearchParams({ ok: Object.keys(cambios).length ? "Parámetros guardados." : "No hubo cambios." })}`);
}

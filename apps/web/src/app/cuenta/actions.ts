"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { exigirUsuario, plazoSolicitud, sumarDiasHabiles } from "@/lib/cuenta";

const perfil = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  telefono: z.string().trim().max(20).optional(),
});

export async function guardarPerfil(formData: FormData) {
  const u = await exigirUsuario("/cuenta");
  const r = perfil.safeParse(Object.fromEntries(formData));
  if (!r.success) redirect(`/cuenta?${new URLSearchParams({ error: r.error.issues[0]?.message ?? "Revisa los datos." })}`);

  await db.update(schema.user).set({ name: r.data.nombre, telefono: r.data.telefono || null, updatedAt: new Date() }).where(eq(schema.user.id, u.id));
  revalidatePath("/cuenta");
  redirect(`/cuenta?${new URLSearchParams({ ok: "Datos guardados." })}`);
}

const solicitud = z.object({
  tipo: z.enum(["consulta", "rectificacion", "supresion", "exportacion"]),
  detalle: z.string().trim().max(1000).optional(),
});

/** CU-26 (Ley 1581): registra la solicitud con su fecha límite en días hábiles. */
export async function crearSolicitudDatos(formData: FormData) {
  const u = await exigirUsuario("/cuenta/privacidad");
  const r = solicitud.safeParse(Object.fromEntries(formData));
  if (!r.success) redirect(`/cuenta/privacidad?${new URLSearchParams({ error: "Elige el tipo de solicitud." })}`);

  const fechaLimite = await sumarDiasHabiles(new Date(), await plazoSolicitud(r.data.tipo));
  await db.insert(schema.solicitudesDatos).values({ usuarioId: u.id, tipo: r.data.tipo, detalle: r.data.detalle || null, fechaLimite });
  revalidatePath("/cuenta/privacidad");
  redirect(`/cuenta/privacidad?${new URLSearchParams({ ok: `Recibimos tu solicitud. Te respondemos a más tardar el ${fechaLimite}.` })}`);
}

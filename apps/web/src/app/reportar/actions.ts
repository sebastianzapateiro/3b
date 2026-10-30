"use server";

/** CU-23 / CU-60: reporte público de una reseña o un perfil. Con suficientes reportes, la reseña se oculta de forma provisional. */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema, consultar } from "@las3b/db";
import { auth } from "@/lib/auth";
import { auditar } from "@/lib/auditoria";
import { MOTIVOS_REPORTE } from "@/lib/reportes";
import { parametro } from "@/lib/parametros";
import { recalcularReputacion } from "@/lib/resenas";

const esquema = z.object({
  tipo: z.enum(["resena", "perfil"]),
  id: z.string().min(1).max(200),
  motivo: z.enum(MOTIVOS_REPORTE),
  detalle: z.string().trim().max(500).optional(),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export async function reportarContenido(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  const base = `/reportar?${new URLSearchParams({ tipo: String(formData.get("tipo") ?? ""), id: String(formData.get("id") ?? "") })}`;
  if (!r.success) redirect(`${base}&error=${encodeURIComponent("Elige un motivo para el reporte.")}`);
  const d = r.data;

  const session = await auth.api.getSession({ headers: await headers() });
  await db.insert(schema.reportes).values({ tipoObjeto: d.tipo, objetoId: d.id, reportanteId: session?.user?.id ?? null, motivo: d.motivo, detalle: d.detalle || null });

  // Reseñas con suficientes reportes pendientes: se ocultan provisionalmente hasta que decida el equipo (nunca por ser negativas, lo decide la persona moderadora).
  if (d.tipo === "resena") {
    const [{ n } = { n: 0 }] = (await consultar(sql`SELECT count(*)::int AS n FROM reportes WHERE tipo_objeto = 'resena' AND objeto_id = ${d.id} AND NOT resuelto`)) as unknown as { n: number }[];
    if (n >= (await parametro("reportes_para_ocultar"))) {
      const [res] = await db.update(schema.resenas).set({ estado: "en_revision" }).where(and(eq(schema.resenas.id, d.id), eq(schema.resenas.estado, "visible"))).returning({ p: schema.resenas.proveedorId });
      if (res) {
        await recalcularReputacion(res.p);
        await auditar({ actorId: null, rol: "sistema", accion: "ocultar_provisional", objetoTipo: "resena", objetoId: d.id, motivo: `${n} reportes` }).catch(() => {});
      }
    }
  }
  redirect(`${base}&enviado=1`);
}

/**
 * B1 · Historial de correos enviados (lo que anota `enviarCorreo`). Solo para el equipo admin, en /admin/correos.
 */
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { correosEnviados } = schema;

export type FiltroCorreos = { estado?: string; texto?: string };

export async function listarCorreosEnviados(f: FiltroCorreos, limite = 100) {
  const texto = f.texto?.trim();
  const cond = [
    f.estado && ["enviado", "error", "simulado"].includes(f.estado) ? eq(correosEnviados.estado, f.estado) : undefined,
    texto ? or(ilike(correosEnviados.para, `%${texto}%`), ilike(correosEnviados.asunto, `%${texto}%`)) : undefined,
  ].filter((c) => c !== undefined);
  const filas = await db.select().from(correosEnviados).where(cond.length ? and(...cond) : undefined).orderBy(desc(correosEnviados.creadoEn)).limit(limite);
  // Resumen de los últimos 7 días, sin filtros, para ver de un vistazo si algo falla.
  const resumen = await db
    .select({ estado: correosEnviados.estado, n: count() })
    .from(correosEnviados)
    .where(sql`${correosEnviados.creadoEn} > now() - interval '7 days'`)
    .groupBy(correosEnviados.estado);
  return { filas, resumen: Object.fromEntries(resumen.map((r) => [r.estado, r.n])) as Record<string, number> };
}

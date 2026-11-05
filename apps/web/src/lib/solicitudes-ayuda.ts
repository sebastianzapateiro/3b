/**
 * A0 / B7 · Solicitudes de ayuda para inscribirse como proveedor (CU-30). Para la web pública, la API y el backoffice.
 * Cada solicitud guarda quién pide, su oficio, de dónde llegó y la autorización de datos (versión, IP y navegador, Ley 1581).
 * El celular es dato personal: solo lo ve el administrador. Si el oficio menciona un servicio que no ofrecemos, se guarda y se marca para revisión.
 */
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { contieneServicioProhibido, normalizarWhatsapp, TRATAMIENTO_DATOS } from "@las3b/shared";
import { consultar, db, schema } from "@las3b/db";
import { ORIGENES_AYUDA } from "@/lib/ayuda-inscripcion";

const { solicitudesAyudaInscripcion: tabla } = schema;

/** Límite contra abuso, por hora e IP. Protege el sistema; no es una regla de negocio. */
const MAX_POR_IP = 5;

export const esquemaAyuda = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  oficio: z.string().trim().min(2, "Cuéntanos tu oficio.").max(120),
  celular: z.string().trim().max(20),
  origen: z.enum(ORIGENES_AYUDA).default("boton_flotante"),
  pagina: z.string().trim().max(200).optional(),
  autoriza: z.literal(true, { error: "Para llamarte necesitamos tu autorización para tratar tus datos." }),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export type RespuestaAyuda = { error: string } | { ok: true };

export async function crearSolicitudAyuda(entrada: unknown, red: { ip: string | null; userAgent: string | null }): Promise<RespuestaAyuda> {
  const r = esquemaAyuda.safeParse(entrada);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  const d = r.data;
  const celular = normalizarWhatsapp(d.celular);
  if (!celular) return { error: "Revisa el número de celular." };

  if (red.ip) {
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(tabla).where(and(eq(tabla.ip, red.ip), gt(tabla.createdAt, new Date(Date.now() - 3_600_000))));
    if ((c?.n ?? 0) >= MAX_POR_IP) return { error: "Hiciste varias solicitudes seguidas. Intenta de nuevo en un rato o escríbenos por WhatsApp." };
  }

  await db.insert(tabla).values({
    nombre: d.nombre,
    oficio: d.oficio,
    celular,
    origen: d.origen,
    pagina: d.pagina?.startsWith("/") ? d.pagina : null,
    revisar: contieneServicioProhibido(d.oficio),
    autorizaDatos: true,
    consentimientoVersion: TRATAMIENTO_DATOS.version,
    ip: red.ip,
    userAgent: red.userAgent,
  });
  return { ok: true };
}

/** B7 · Lista para el administrador: las nuevas primero, luego las más recientes. */
export async function listarSolicitudesAyuda(limite = 200) {
  return db
    .select({
      id: tabla.id, creada: tabla.createdAt, nombre: tabla.nombre, oficio: tabla.oficio, celular: tabla.celular, estado: tabla.estado,
      origen: tabla.origen, pagina: tabla.pagina, revisar: tabla.revisar, contactadaEn: tabla.contactadaEn, version: tabla.consentimientoVersion,
    })
    .from(tabla)
    .orderBy(sql`(${tabla.estado} = 'nueva') DESC`, sql`${tabla.createdAt} DESC`)
    .limit(limite);
}

/** B7 · Conteo por día (últimos 14, hora de Bogotá) y por origen, y cuántas siguen sin contactar. */
export async function conteosAyuda() {
  const [porDia, porOrigen, [nuevas]] = await Promise.all([
    consultar<{ dia: string; total: number }>(sql`
      SELECT to_char((created_at AT TIME ZONE 'America/Bogota')::date, 'YYYY-MM-DD') AS dia, count(*)::int AS total
      FROM solicitudes_ayuda_inscripcion
      WHERE created_at > now() - interval '14 days'
      GROUP BY 1 ORDER BY 1 DESC`),
    db.select({ origen: tabla.origen, total: sql<number>`count(*)::int` }).from(tabla).groupBy(tabla.origen),
    db.select({ n: sql<number>`count(*)::int` }).from(tabla).where(eq(tabla.estado, "nueva")),
  ]);
  return { porDia, porOrigen, nuevas: nuevas?.n ?? 0 };
}

export async function marcarAyudaContactada(id: string, actorId: string) {
  await db.update(tabla).set({ estado: "contactada", contactadaPor: actorId, contactadaEn: new Date() }).where(eq(tabla.id, id));
}

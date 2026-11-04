/**
 * B1 · Actividad de proveedores: registra cada movimiento, avisa al fundador por correo (cola con agrupación) y alimenta
 * la vista «Actividad reciente» de /admin. Un fallo aquí NUNCA debe romper ni retrasar el registro del proveedor.
 */
import { and, desc, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { armarCorreo, type DatosAviso } from "./actividad-correo";
import { MAX_INTENTOS, notificacionesActivas, procesarCola, type DepsCola, type EventoCola, type GrupoEnvio, type TipoEvento } from "./actividad-cola";
import { enviarCorreo } from "./correo";
import { SITIO_URL } from "./seo";

const { avisosProveedor, proveedores, proveedorCategorias, categorias, proveedorLocalidades, localidades } = schema;

/** Registra un movimiento. Nunca lanza: si algo falla, solo se anota en el log. */
export async function registrarEvento(proveedorId: string, tipo: TipoEvento, o: { campos?: string[]; detalle?: string; clave?: string } = {}): Promise<void> {
  try {
    await db
      .insert(avisosProveedor)
      .values({
        proveedorId,
        tipo,
        campos: o.campos ?? [],
        detalle: o.detalle ?? null,
        clave: o.clave ?? null,
        // Con las notificaciones apagadas el movimiento queda en «Actividad reciente» pero no genera correo.
        enviadoEn: notificacionesActivas() ? null : new Date(),
      })
      .onConflictDoNothing();
  } catch (e) {
    console.error("[actividad] No se pudo registrar el evento:", e);
  }
}

/** Origen del primer ingreso, leído de la cookie que guarda el proxy al llegar con parámetros utm_*. */
export const COOKIE_ORIGEN = "las3b_origen";
export type Origen = { source?: string; medium?: string; campaign?: string; content?: string; term?: string };

export function origenDeCabeceras(cabeceras: Headers | undefined | null): Origen | null {
  const c = cabeceras?.get("cookie")?.split(/;\s*/).find((x) => x.startsWith(`${COOKIE_ORIGEN}=`));
  if (!c) return null;
  try {
    const o = JSON.parse(decodeURIComponent(c.slice(COOKIE_ORIGEN.length + 1))) as Record<string, unknown>;
    const t = (v: unknown) => (typeof v === "string" ? v.slice(0, 120) : undefined);
    return { source: t(o.source), medium: t(o.medium), campaign: t(o.campaign), content: t(o.content), term: t(o.term) };
  } catch {
    return null;
  }
}

/** Guarda el origen (UTM) del proveedor la primera vez; nunca lo pisa. */
export async function guardarOrigen(proveedorId: string, origen: Origen | null): Promise<void> {
  if (!origen || !Object.values(origen).some(Boolean)) return;
  try {
    await db
      .update(proveedores)
      .set({ utmSource: origen.source ?? null, utmMedium: origen.medium ?? null, utmCampaign: origen.campaign ?? null, utmContent: origen.content ?? null, utmTerm: origen.term ?? null })
      .where(and(eq(proveedores.id, proveedorId), isNull(proveedores.utmSource), isNull(proveedores.utmTerm)));
  } catch (e) {
    console.error("[actividad] No se pudo guardar el origen:", e);
  }
}

/* ---------- Cola real (base de datos + correo) ---------- */

async function datosDelAviso(proveedorId: string): Promise<DatosAviso | null> {
  const [p] = await db
    .select({ nombre: proveedores.nombrePublico, whatsapp: proveedores.whatsapp, s: proveedores.utmSource, m: proveedores.utmMedium, c: proveedores.utmCampaign, k: proveedores.utmContent, t: proveedores.utmTerm })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);
  if (!p) return null;
  const [ofi, zon] = await Promise.all([
    db.select({ n: categorias.nombre }).from(proveedorCategorias).innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId)).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ n: localidades.nombre }).from(proveedorLocalidades).innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId)).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
  ]);
  // Import dinámico: alta-proveedor importa este módulo.
  const { pendientesAlta } = await import("./alta-proveedor");
  const alta = await pendientesAlta(proveedorId);
  return {
    proveedorId,
    nombre: p.nombre,
    whatsapp: p.whatsapp,
    oficios: ofi.map((o) => o.n),
    zonas: zon.map((z) => z.n),
    porcentaje: alta.porcentaje,
    faltan: alta.tareas.filter((t) => !t.ok).map((t) => t.titulo),
    origen: { source: p.s, medium: p.m, campaign: p.c, content: p.k, term: p.t },
    urlAdmin: `${SITIO_URL}/admin/proveedores/${proveedorId}`,
  };
}

/** Interfaz de envío al administrador. SMTP u otro proveedor se cambian aquí sin tocar el resto. */
export async function sendAdminEmail(m: { asunto: string; texto: string; html: string }): Promise<void> {
  const para = process.env.ADMIN_NOTIFY_EMAIL;
  if (!para) throw new Error("Falta ADMIN_NOTIFY_EMAIL");
  const de = process.env.NOTIFY_FROM || "LasTresB <notificaciones@lastresb.com.co>";
  // Simulación: se muestra en consola y no se envía nada (también si no hay clave del proveedor de correo).
  if (process.env.NOTIFY_DRY_RUN === "true" || !process.env.RESEND_API_KEY) {
    console.info(`[avisos·simulación] De: ${de}\n[avisos·simulación] Para: ${para}\n[avisos·simulación] Asunto: ${m.asunto}\n${m.texto}\n`);
    return;
  }
  if (!(await enviarCorreo({ para, de, asunto: m.asunto, texto: m.texto, html: m.html }))) throw new Error("El proveedor de correo no aceptó el mensaje");
}

const depsReales: DepsCola = {
  async leerPendientes() {
    const filas = await db
      .select()
      .from(avisosProveedor)
      .where(and(isNull(avisosProveedor.enviadoEn), lt(avisosProveedor.intentos, MAX_INTENTOS)))
      .orderBy(avisosProveedor.creadoEn)
      .limit(500);
    return filas.map((f): EventoCola => ({ id: f.id, proveedorId: f.proveedorId, tipo: f.tipo as TipoEvento, campos: f.campos, detalle: f.detalle, creadoEn: f.creadoEn, intentos: f.intentos, proximoIntento: f.proximoIntento }));
  },
  async reclamar(ids, ahora) {
    const r = await db.update(avisosProveedor).set({ enviadoEn: ahora, error: null }).where(and(inArray(avisosProveedor.id, ids), isNull(avisosProveedor.enviadoEn))).returning({ id: avisosProveedor.id });
    return r.map((x) => x.id);
  },
  async enviar(g: GrupoEnvio) {
    const datos = await datosDelAviso(g.proveedorId);
    if (!datos) return; // el proveedor ya no existe: nada que avisar
    await sendAdminEmail(armarCorreo(datos, g.eventos));
  },
  async fallo(ids, error, intentos, proximo) {
    await db.update(avisosProveedor).set({ enviadoEn: null, error: error.slice(0, 500), intentos, proximoIntento: proximo }).where(inArray(avisosProveedor.id, ids));
  },
};

/** Lo llama el proceso programado cada minuto (/api/cron/avisos). */
export async function enviarAvisosPendientes() {
  if (!notificacionesActivas()) return { enviados: 0, correos: 0, fallidos: 0, apagado: true };
  return procesarCola(depsReales);
}

/* ---------- Vista «Actividad reciente» (B1, solo administradores) ---------- */

export type FiltroActividad = { tipo?: string; oficio?: string; desde?: string; hasta?: string; soloSinVer?: boolean };

export async function listarActividad(f: FiltroActividad, limite = 100) {
  const cond = [
    f.tipo ? eq(avisosProveedor.tipo, f.tipo) : undefined,
    f.desde ? gte(avisosProveedor.creadoEn, new Date(`${f.desde}T00:00:00-05:00`)) : undefined,
    f.hasta ? lte(avisosProveedor.creadoEn, new Date(`${f.hasta}T23:59:59-05:00`)) : undefined,
    f.soloSinVer ? isNull(avisosProveedor.vistoEn) : undefined,
    f.oficio ? sql`EXISTS (SELECT 1 FROM proveedor_categorias pc WHERE pc.proveedor_id = ${avisosProveedor.proveedorId} AND pc.categoria_id = ${Number(f.oficio)})` : undefined,
  ].filter((c) => c !== undefined);
  const filas = await db
    .select({
      id: avisosProveedor.id, proveedorId: avisosProveedor.proveedorId, tipo: avisosProveedor.tipo, campos: avisosProveedor.campos, detalle: avisosProveedor.detalle,
      creadoEn: avisosProveedor.creadoEn, vistoEn: avisosProveedor.vistoEn, enviadoEn: avisosProveedor.enviadoEn, error: avisosProveedor.error,
      nombre: proveedores.nombrePublico, s: proveedores.utmSource, m: proveedores.utmMedium, c: proveedores.utmCampaign, t: proveedores.utmTerm,
    })
    .from(avisosProveedor)
    .innerJoin(proveedores, eq(proveedores.id, avisosProveedor.proveedorId))
    .where(cond.length ? and(...cond) : undefined)
    .orderBy(desc(avisosProveedor.creadoEn))
    .limit(limite);
  const [sin] = await db.select({ n: sql<number>`count(*)::int` }).from(avisosProveedor).where(isNull(avisosProveedor.vistoEn));
  return { filas, sinVer: sin?.n ?? 0 };
}

export async function marcarVistos(ids?: string[]) {
  await db.update(avisosProveedor).set({ vistoEn: new Date() }).where(and(isNull(avisosProveedor.vistoEn), ids?.length ? inArray(avisosProveedor.id, ids) : undefined));
}
